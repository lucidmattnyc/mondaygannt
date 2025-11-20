import {
  MondayItem,
  MondayBoard,
  GanttTask,
  GanttSettings,
  MondayColumnValue,
  TimelineData,
  MirrorColumnMapping
} from '../types';
import moment from 'moment';

class DataProcessor {
  private boards: MondayBoard[] = [];
  private allItems: { [boardId: string]: MondayItem[] } = {};
  private mirrorMappings: { [boardId: string]: MirrorColumnMapping[] } = {};

  setBoards(boards: MondayBoard[]): void {
    this.boards = boards;
  }

  setItems(items: { [boardId: string]: MondayItem[] }): void {
    this.allItems = items;
  }

  setMirrorMappings(mappings: { [boardId: string]: MirrorColumnMapping[] }): void {
    this.mirrorMappings = mappings;
  }

  processItemsToGanttTasks(settings: GanttSettings): GanttTask[] {
    const tasks: GanttTask[] = [];

    Object.entries(this.allItems).forEach(([boardId, items]) => {
      const board = this.boards.find(b => b.id === boardId);
      if (!board) return;

      items.forEach(item => {
        const task = this.convertItemToGanttTask(item, board, settings);
        if (task) {
          tasks.push(task);

          if (settings.showSubitems && item.subitems) {
            item.subitems.forEach(subitem => {
              const subtask = this.convertItemToGanttTask(subitem, board, settings, task.id);
              if (subtask) {
                tasks.push(subtask);
              }
            });
          }
        }
      });
    });

    return this.applySettingsToTasks(tasks, settings);
  }

  private convertItemToGanttTask(
    item: MondayItem,
    board: MondayBoard,
    settings: GanttSettings,
    parentId?: string
  ): GanttTask | null {
    const timelineData = this.extractTimelineData(item, settings.timelineColumn);

    if (!timelineData.from && !timelineData.to) {
      return null;
    }

    const mirrorData = this.extractMirrorData(item, board.id);

    const task: GanttTask = {
      id: item.id,
      name: item.name,
      startDate: timelineData.from,
      endDate: timelineData.to,
      progress: this.extractProgress(item),
      color: this.extractColor(item, settings.colorByColumn, mirrorData),
      group: this.extractGroup(item, settings.groupByColumn, mirrorData),
      boardId: board.id,
      boardName: board.name,
      parentId,
      originalItem: item,
      mirrorData
    };

    return task;
  }

  private extractTimelineData(item: MondayItem, timelineColumnId?: string): TimelineData {
    let timelineColumn: MondayColumnValue | undefined;

    if (timelineColumnId) {
      timelineColumn = item.column_values.find(cv => cv.id === timelineColumnId);
    } else {
      timelineColumn = item.column_values.find(cv =>
        cv.type === 'timeline' || cv.type === 'date' || cv.type === 'creation_log'
      );
    }

    if (!timelineColumn || !timelineColumn.value) {
      return { from: null, to: null };
    }

    try {
      if (timelineColumn.type === 'timeline') {
        const timelineValue = JSON.parse(timelineColumn.value);
        return {
          from: timelineValue.from ? new Date(timelineValue.from) : null,
          to: timelineValue.to ? new Date(timelineValue.to) : null
        };
      } else if (timelineColumn.type === 'date') {
        const dateValue = JSON.parse(timelineColumn.value);
        const date = dateValue.date ? new Date(dateValue.date) : null;
        return {
          from: date,
          to: date
        };
      }
    } catch (error) {
      console.warn('Error parsing timeline data:', error);
    }

    return { from: null, to: null };
  }

  private extractMirrorData(item: MondayItem, boardId: string): { [key: string]: any } {
    const mirrorData: { [key: string]: any } = {};
    const mappings = this.mirrorMappings[boardId] || [];

    mappings.forEach(mapping => {
      const mirrorColumn = item.column_values.find(cv => cv.id === mapping.mirrorColumnId);
      if (mirrorColumn && mirrorColumn.value) {
        try {
          const parsedValue = JSON.parse(mirrorColumn.value);
          mirrorData[mapping.mirrorColumnId] = {
            displayValue: mirrorColumn.text,
            rawValue: parsedValue,
            sourceColumnTitle: mapping.sourceColumnTitle,
            sourceBoardName: mapping.sourceBoardName,
            type: mirrorColumn.type
          };
        } catch (error) {
          mirrorData[mapping.mirrorColumnId] = {
            displayValue: mirrorColumn.text,
            rawValue: mirrorColumn.value,
            sourceColumnTitle: mapping.sourceColumnTitle,
            sourceBoardName: mapping.sourceBoardName,
            type: mirrorColumn.type
          };
        }
      }
    });

    return mirrorData;
  }

  private extractProgress(item: MondayItem): number {
    const progressColumn = item.column_values.find(cv =>
      cv.type === 'numeric' && (
        cv.title.toLowerCase().includes('progress') ||
        cv.title.toLowerCase().includes('complete') ||
        cv.title.toLowerCase().includes('%')
      )
    );

    if (progressColumn && progressColumn.value) {
      try {
        const numericValue = JSON.parse(progressColumn.value);
        return Math.max(0, Math.min(100, numericValue || 0));
      } catch (error) {
        return 0;
      }
    }

    return 0;
  }

  private extractColor(
    item: MondayItem,
    colorByColumnId?: string,
    mirrorData?: { [key: string]: any }
  ): string {
    if (colorByColumnId) {
      if (mirrorData && mirrorData[colorByColumnId]) {
        return this.getColorFromValue(mirrorData[colorByColumnId]);
      }

      const colorColumn = item.column_values.find(cv => cv.id === colorByColumnId);
      if (colorColumn) {
        return this.getColorFromColumnValue(colorColumn);
      }
    }

    if (item.group) {
      return item.group.color;
    }

    return '#037f4c';
  }

  private extractGroup(
    item: MondayItem,
    groupByColumnId?: string,
    mirrorData?: { [key: string]: any }
  ): string {
    if (groupByColumnId) {
      if (mirrorData && mirrorData[groupByColumnId]) {
        return mirrorData[groupByColumnId].displayValue || 'Unknown';
      }

      const groupColumn = item.column_values.find(cv => cv.id === groupByColumnId);
      if (groupColumn) {
        return groupColumn.text || 'Unknown';
      }
    }

    return item.group?.title || 'No Group';
  }

  private getColorFromValue(mirrorValue: any): string {
    if (mirrorValue.type === 'color' && mirrorValue.rawValue) {
      try {
        const colorData = typeof mirrorValue.rawValue === 'string'
          ? JSON.parse(mirrorValue.rawValue)
          : mirrorValue.rawValue;
        return colorData.color || '#037f4c';
      } catch (error) {
        return '#037f4c';
      }
    }

    if (mirrorValue.type === 'status' && mirrorValue.rawValue) {
      try {
        const statusData = typeof mirrorValue.rawValue === 'string'
          ? JSON.parse(mirrorValue.rawValue)
          : mirrorValue.rawValue;
        return statusData.color || '#037f4c';
      } catch (error) {
        return '#037f4c';
      }
    }

    return '#037f4c';
  }

  private getColorFromColumnValue(column: MondayColumnValue): string {
    if (!column.value) return '#037f4c';

    try {
      if (column.type === 'color') {
        const colorData = JSON.parse(column.value);
        return colorData.color || '#037f4c';
      }

      if (column.type === 'status') {
        const statusData = JSON.parse(column.value);
        return statusData.color || '#037f4c';
      }

      if (column.type === 'dropdown') {
        const dropdownData = JSON.parse(column.value);
        return dropdownData.color || '#037f4c';
      }
    } catch (error) {
      console.warn('Error parsing column color:', error);
    }

    return '#037f4c';
  }

  private applySettingsToTasks(tasks: GanttTask[], settings: GanttSettings): GanttTask[] {
    let processedTasks = [...tasks];

    if (settings.sortByColumn && settings.sortDirection) {
      processedTasks = this.sortTasks(processedTasks, settings.sortByColumn, settings.sortDirection);
    }

    return processedTasks;
  }

  private sortTasks(tasks: GanttTask[], sortByColumn: string, direction: 'asc' | 'desc'): GanttTask[] {
    return tasks.sort((a, b) => {
      let aValue: any = null;
      let bValue: any = null;

      if (sortByColumn === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else if (sortByColumn === 'start_date') {
        aValue = a.startDate;
        bValue = b.startDate;
      } else if (sortByColumn === 'end_date') {
        aValue = a.endDate;
        bValue = b.endDate;
      } else {
        const aColumn = a.originalItem.column_values.find(cv => cv.id === sortByColumn);
        const bColumn = b.originalItem.column_values.find(cv => cv.id === sortByColumn);

        aValue = aColumn?.text || '';
        bValue = bColumn?.text || '';

        if (aColumn?.type === 'numeric' || aColumn?.type === 'rating') {
          try {
            aValue = parseFloat(JSON.parse(aColumn.value || '0'));
            bValue = parseFloat(JSON.parse(bColumn?.value || '0'));
          } catch (error) {
            aValue = 0;
            bValue = 0;
          }
        }
      }

      if (aValue === null || aValue === undefined) aValue = direction === 'asc' ? '' : 'zzz';
      if (bValue === null || bValue === undefined) bValue = direction === 'asc' ? '' : 'zzz';

      if (aValue instanceof Date && bValue instanceof Date) {
        return direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }

  getAvailableColumns(includeBasicColumns: boolean = true): Array<{id: string, title: string, type: string}> {
    const columns: Array<{id: string, title: string, type: string}> = [];

    if (includeBasicColumns) {
      columns.push(
        { id: 'name', title: 'Item Name', type: 'text' },
        { id: 'start_date', title: 'Start Date', type: 'date' },
        { id: 'end_date', title: 'End Date', type: 'date' },
        { id: 'group', title: 'Group', type: 'text' },
        { id: 'board', title: 'Board', type: 'text' }
      );
    }

    this.boards.forEach(board => {
      board.columns.forEach(column => {
        if (!column.archived && !columns.find(c => c.id === column.id)) {
          columns.push({
            id: column.id,
            title: `${column.title} (${board.name})`,
            type: column.type
          });
        }
      });
    });

    return columns;
  }
}

export default new DataProcessor();
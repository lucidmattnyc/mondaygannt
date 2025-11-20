export interface MondayColumn {
  id: string;
  title: string;
  type: string;
  settings_str?: string;
  archived?: boolean;
}

export interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
  group?: MondayGroup;
  board?: MondayBoard;
  subitems?: MondayItem[];
}

export interface MondayColumnValue {
  id: string;
  title: string;
  type: string;
  value: any;
  text: string;
  additional_info?: any;
}

export interface MondayGroup {
  id: string;
  title: string;
  color: string;
  position: string;
}

export interface MondayBoard {
  id: string;
  name: string;
  description?: string;
  board_kind: string;
  columns: MondayColumn[];
  groups: MondayGroup[];
  items?: MondayItem[];
}

export interface TimelineData {
  from: Date | null;
  to: Date | null;
}

export interface GanttTask {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  progress?: number;
  color?: string;
  group?: string;
  boardId?: string;
  boardName?: string;
  parentId?: string;
  children?: GanttTask[];
  originalItem: MondayItem;
  mirrorData?: { [key: string]: any };
}

export interface GanttSettings {
  colorByColumn?: string;
  groupByColumn?: string;
  sortByColumn?: string;
  sortDirection?: 'asc' | 'desc';
  showSubitems?: boolean;
  timelineColumn?: string;
  mirrorColumns?: string[];
  selectedBoards?: string[];
}

export interface WidgetContext {
  instanceId?: number;
  boardIds?: number[];
  theme?: 'light' | 'dark';
  viewMode?: 'dashboard' | 'board';
  editMode?: boolean;
}

export interface MirrorColumnMapping {
  sourceColumnId: string;
  sourceColumnTitle: string;
  sourceBoardId: string;
  sourceBoardName: string;
  mirrorColumnId: string;
  mirrorColumnTitle: string;
  targetBoardId: string;
}

export type ColorByOption = {
  value: string;
  label: string;
  type: 'column' | 'board' | 'group';
};

export type GroupByOption = {
  value: string;
  label: string;
  type: 'column' | 'board' | 'group';
};

export type SortByOption = {
  value: string;
  label: string;
  type: 'column' | 'date' | 'text';
};
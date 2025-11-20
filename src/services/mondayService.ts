import mondaySdk from 'monday-sdk-js';
import {
  MondayBoard,
  MondayItem,
  MondayColumn,
  MirrorColumnMapping,
  WidgetContext
} from '../types';

class MondayService {
  private monday: any;

  constructor() {
    this.monday = mondaySdk();
  }

  async initializeWidget(): Promise<WidgetContext> {
    try {
      const context = await this.monday.get('context');
      console.log('Monday context:', context);

      let boardIds: number[] = [];
      let viewMode = 'dashboard';

      // Handle different contexts
      if (context.boardId) {
        // Single board context (Board View)
        boardIds = [parseInt(context.boardId)];
        viewMode = 'board';
      } else if (context.boardIds && context.boardIds.length > 0) {
        // Multiple boards context (Dashboard Widget)
        boardIds = context.boardIds;
        viewMode = 'dashboard';
      } else if (context.instanceType === 'board_view') {
        // Try to get board ID from URL or other context
        viewMode = 'board';
        // Get board ID from current location
        const urlParams = new URLSearchParams(window.location.search);
        const boardIdFromUrl = urlParams.get('boardId') || urlParams.get('board_id');
        if (boardIdFromUrl) {
          boardIds = [parseInt(boardIdFromUrl)];
        }
      }

      return {
        instanceId: context.instanceId,
        boardIds,
        theme: context.theme || 'light',
        viewMode: viewMode as 'dashboard' | 'board',
        editMode: context.editMode || false
      };
    } catch (error) {
      console.error('Error initializing widget:', error);
      return {
        boardIds: [],
        theme: 'light',
        viewMode: 'dashboard',
        editMode: false
      };
    }
  }

  async getCurrentBoard(): Promise<MondayBoard | null> {
    try {
      // Try to get board from context first
      const context = await this.monday.get('context');
      console.log('getCurrentBoard context:', context);

      if (context.boardId) {
        console.log('Found boardId in context:', context.boardId);
        const boards = await this.getBoards([parseInt(context.boardId)]);
        return boards[0] || null;
      }

      // Try to extract board ID from URL
      const urlBoardId = this.extractBoardIdFromUrl();
      if (urlBoardId) {
        console.log('Extracted boardId from URL:', urlBoardId);
        const boards = await this.getBoards([parseInt(urlBoardId)]);
        return boards[0] || null;
      }

      // Try to get board from location context
      if (typeof window !== 'undefined' && window.location) {
        const pathname = window.location.pathname;
        const boardMatch = pathname.match(/\/boards\/(\d+)/);
        if (boardMatch) {
          const boardId = boardMatch[1];
          console.log('Found boardId in pathname:', boardId);
          const boards = await this.getBoards([parseInt(boardId)]);
          return boards[0] || null;
        }
      }

      console.warn('No board ID found in context or URL');
      return null;
    } catch (error) {
      console.error('Error fetching current board:', error);
      return null;
    }
  }

  private extractBoardIdFromUrl(): string | null {
    if (typeof window === 'undefined') return null;

    const url = window.location.href;
    console.log('Current URL:', url);

    // Try multiple URL patterns
    const patterns = [
      /\/boards\/(\d+)/,
      /boardId[=:](\d+)/,
      /board_id[=:](\d+)/,
      /boards%2F(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  async getBoards(boardIds?: number[]): Promise<MondayBoard[]> {
    const query = `
      query($boardIds: [Int!]) {
        boards(ids: $boardIds) {
          id
          name
          description
          board_kind
          columns {
            id
            title
            type
            settings_str
            archived
          }
          groups {
            id
            title
            color
            position
          }
        }
      }
    `;

    try {
      const response = await this.monday.api(query, { variables: { boardIds } });
      return response.data?.boards || [];
    } catch (error) {
      console.error('Error fetching boards:', error);
      return [];
    }
  }

  async getBoardItems(boardId: string, limit: number = 100): Promise<MondayItem[]> {
    const query = `
      query($boardId: [Int!], $limit: Int) {
        boards(ids: $boardId) {
          items_page(limit: $limit) {
            items {
              id
              name
              column_values {
                id
                title
                type
                value
                text
                additional_info
              }
              group {
                id
                title
                color
                position
              }
              subitems {
                id
                name
                column_values {
                  id
                  title
                  type
                  value
                  text
                  additional_info
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.monday.api(query, {
        variables: { boardId: [parseInt(boardId)], limit }
      });

      const board = response.data?.boards?.[0];
      return board?.items_page?.items || [];
    } catch (error) {
      console.error(`Error fetching items for board ${boardId}:`, error);
      return [];
    }
  }

  async getAllBoardItems(boardIds: string[]): Promise<{ [boardId: string]: MondayItem[] }> {
    const results: { [boardId: string]: MondayItem[] } = {};

    await Promise.all(
      boardIds.map(async (boardId) => {
        results[boardId] = await this.getBoardItems(boardId);
      })
    );

    return results;
  }

  async getMirrorColumnMappings(boardId: string): Promise<MirrorColumnMapping[]> {
    const query = `
      query($boardId: [Int!]) {
        boards(ids: $boardId) {
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;

    try {
      const response = await this.monday.api(query, {
        variables: { boardId: [parseInt(boardId)] }
      });

      const board = response.data?.boards?.[0];
      const columns = board?.columns || [];

      const mirrorColumns = columns.filter((col: MondayColumn) =>
        col.type === 'mirror' || col.type === 'lookup'
      );

      const mappings: MirrorColumnMapping[] = [];

      for (const mirrorCol of mirrorColumns) {
        try {
          const settings = JSON.parse(mirrorCol.settings_str || '{}');

          if (settings.mirrorBoardId && settings.mirrorColumnId) {
            const sourceBoardQuery = `
              query($sourceBoardId: [Int!]) {
                boards(ids: $sourceBoardId) {
                  id
                  name
                  columns {
                    id
                    title
                  }
                }
              }
            `;

            const sourceBoardResponse = await this.monday.api(sourceBoardQuery, {
              variables: { sourceBoardId: [parseInt(settings.mirrorBoardId)] }
            });

            const sourceBoard = sourceBoardResponse.data?.boards?.[0];
            const sourceColumn = sourceBoard?.columns?.find(
              (col: MondayColumn) => col.id === settings.mirrorColumnId
            );

            if (sourceBoard && sourceColumn) {
              mappings.push({
                sourceColumnId: settings.mirrorColumnId,
                sourceColumnTitle: sourceColumn.title,
                sourceBoardId: settings.mirrorBoardId,
                sourceBoardName: sourceBoard.name,
                mirrorColumnId: mirrorCol.id,
                mirrorColumnTitle: mirrorCol.title,
                targetBoardId: boardId
              });
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse mirror column settings:', parseError);
        }
      }

      return mappings;
    } catch (error) {
      console.error('Error fetching mirror column mappings:', error);
      return [];
    }
  }

  async getConnectedBoards(): Promise<MondayBoard[]> {
    const query = `
      query {
        me {
          account {
            id
          }
        }
        boards(limit: 100) {
          id
          name
          description
          board_kind
          columns {
            id
            title
            type
            settings_str
            archived
          }
          groups {
            id
            title
            color
            position
          }
        }
      }
    `;

    try {
      const response = await this.monday.api(query);
      const allBoards = response.data?.boards || [];

      // Filter out subitem boards and boards we don't want to show
      const filteredBoards = allBoards.filter((board: MondayBoard) => {
        // Exclude subitem boards (they usually have "Subitems of" prefix)
        if (board.name && board.name.toLowerCase().includes('subitems of')) {
          return false;
        }

        // Exclude certain board kinds if needed
        if (board.board_kind === 'private' || board.board_kind === 'share') {
          return false;
        }

        return true;
      });

      console.log('Filtered boards:', filteredBoards);
      return filteredBoards;
    } catch (error) {
      console.error('Error fetching connected boards:', error);
      return [];
    }
  }

  async saveWidgetSettings(settings: any): Promise<void> {
    try {
      await this.monday.storage.instance.setItem('gantt_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving widget settings:', error);
    }
  }

  async loadWidgetSettings(): Promise<any> {
    try {
      const settings = await this.monday.storage.instance.getItem('gantt_settings');
      return settings ? JSON.parse(settings.value) : null;
    } catch (error) {
      console.error('Error loading widget settings:', error);
      return null;
    }
  }

  showNotice(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.monday.execute('notice', {
      message,
      type
    });
  }

  async showConfirm(message: string): Promise<boolean> {
    try {
      const result = await this.monday.execute('confirm', {
        message,
        confirmButton: 'Yes',
        cancelButton: 'No'
      });
      return result.confirm;
    } catch (error) {
      return false;
    }
  }
}

export default new MondayService();
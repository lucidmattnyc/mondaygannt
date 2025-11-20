import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import GanttChart from './components/GanttChart';
import SettingsPanel from './components/SettingsPanel';
import {
  GanttSettings,
  GanttTask,
  MondayBoard,
  MondayItem,
  WidgetContext
} from './types';
import mondayService from './services/mondayService';
import dataProcessor from './services/dataProcessor';

const AppContainer = styled.div<{ theme: 'light' | 'dark' }>`
  width: 100%;
  height: 100vh;
  background-color: ${props => props.theme === 'dark' ? '#292f3a' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#333333'};
  font-family: "Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  position: relative;
`;

const Header = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e0e0e0'};
  background-color: ${props => props.theme === 'dark' ? '#3a4149' : '#f5f6f8'};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary'; theme: 'light' | 'dark' }>`
  padding: 8px 16px;
  border: ${props => props.variant === 'primary' ? 'none' : `1px solid ${props.theme === 'dark' ? '#555' : '#ddd'}`};
  border-radius: 4px;
  background-color: ${props => {
    if (props.variant === 'primary') return '#037f4c';
    return props.theme === 'dark' ? 'transparent' : '#ffffff';
  }};
  color: ${props => {
    if (props.variant === 'primary') return '#ffffff';
    return props.theme === 'dark' ? '#ffffff' : '#333333';
  }};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => {
      if (props.variant === 'primary') return '#025d38';
      return props.theme === 'dark' ? '#3a4149' : '#f5f6f8';
    }};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(3, 127, 76, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Content = styled.div`
  height: calc(100vh - 73px);
  overflow: hidden;
`;

const LoadingContainer = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const LoadingText = styled.div`
  font-size: 16px;
  margin-top: 16px;
`;

const Spinner = styled.div<{ theme: 'light' | 'dark' }>`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme === 'dark' ? '#444' : '#e0e0e0'};
  border-top: 3px solid #037f4c;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme === 'dark' ? '#ff6b6b' : '#dc3545'};
  text-align: center;
  padding: 24px;
`;

const ErrorText = styled.div`
  font-size: 16px;
  margin-bottom: 16px;
`;

const App: React.FC = () => {
  const [context, setContext] = useState<WidgetContext | null>(null);
  const [boards, setBoards] = useState<MondayBoard[]>([]);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [settings, setSettings] = useState<GanttSettings>({
    showSubitems: true,
    sortDirection: 'asc'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initializeWidget();
  }, []);

  useEffect(() => {
    if (boards.length > 0) {
      loadTasks();
    }
  }, [boards, settings]);

  const initializeWidget = async () => {
    try {
      setLoading(true);
      setError(null);

      const widgetContext = await mondayService.initializeWidget();
      setContext(widgetContext);

      const savedSettings = await mondayService.loadWidgetSettings();
      if (savedSettings) {
        setSettings({ ...settings, ...savedSettings });
      }

      let boardsToLoad: MondayBoard[] = [];

      if (widgetContext.boardIds && widgetContext.boardIds.length > 0) {
        boardsToLoad = await mondayService.getBoards(widgetContext.boardIds);
      } else {
        boardsToLoad = await mondayService.getConnectedBoards();
      }

      setBoards(boardsToLoad);
      dataProcessor.setBoards(boardsToLoad);

      await loadMirrorMappings(boardsToLoad);

    } catch (err) {
      setError('Failed to initialize widget. Please check your connection and permissions.');
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMirrorMappings = async (boardsToLoad: MondayBoard[]) => {
    try {
      const mappings: { [boardId: string]: any[] } = {};

      await Promise.all(
        boardsToLoad.map(async (board) => {
          const boardMappings = await mondayService.getMirrorColumnMappings(board.id);
          mappings[board.id] = boardMappings;
        })
      );

      dataProcessor.setMirrorMappings(mappings);
    } catch (err) {
      console.warn('Failed to load mirror column mappings:', err);
    }
  };

  const loadTasks = async () => {
    try {
      const selectedBoardIds = settings.selectedBoards && settings.selectedBoards.length > 0
        ? settings.selectedBoards
        : boards.map(board => board.id);

      if (selectedBoardIds.length === 0) {
        setTasks([]);
        return;
      }

      const allItems = await mondayService.getAllBoardItems(selectedBoardIds);
      dataProcessor.setItems(allItems);

      const ganttTasks = dataProcessor.processItemsToGanttTasks(settings);
      setTasks(ganttTasks);

    } catch (err) {
      setError('Failed to load tasks. Please try again.');
      console.error('Task loading error:', err);
    }
  };

  const handleSettingsChange = async (newSettings: GanttSettings) => {
    setSettings(newSettings);
    await mondayService.saveWidgetSettings(newSettings);
    mondayService.showNotice('Settings saved successfully', 'success');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadTasks();
      mondayService.showNotice('Data refreshed successfully', 'success');
    } catch (err) {
      mondayService.showNotice('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTaskClick = (task: GanttTask) => {
    console.log('Task clicked:', task);
    if (task.mirrorData && Object.keys(task.mirrorData).length > 0) {
      let message = `Mirror data for ${task.name}:\n\n`;
      Object.values(task.mirrorData).forEach(data => {
        message += `${data.sourceColumnTitle}: ${data.displayValue}\n`;
        message += `Source: ${data.sourceBoardName}\n\n`;
      });
      mondayService.showNotice(message, 'info');
    }
  };

  const handleTaskUpdate = async (taskId: string, startDate: Date, endDate: Date) => {
    console.log('Task update:', taskId, startDate, endDate);
    mondayService.showNotice('Task update functionality would be implemented here', 'info');
  };

  const availableColumns = dataProcessor.getAvailableColumns();

  if (loading) {
    return (
      <AppContainer theme={context?.theme || 'light'}>
        <LoadingContainer theme={context?.theme || 'light'}>
          <Spinner theme={context?.theme || 'light'} />
          <LoadingText>Loading your Gantt chart...</LoadingText>
        </LoadingContainer>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer theme={context?.theme || 'light'}>
        <ErrorContainer theme={context?.theme || 'light'}>
          <ErrorText>{error}</ErrorText>
          <Button
            theme={context?.theme || 'light'}
            variant="primary"
            onClick={initializeWidget}
          >
            Try Again
          </Button>
        </ErrorContainer>
      </AppContainer>
    );
  }

  return (
    <AppContainer theme={context?.theme || 'light'}>
      <Header theme={context?.theme || 'light'}>
        <Title>Enhanced Gantt Chart</Title>
        <HeaderActions>
          <Button
            theme={context?.theme || 'light'}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            theme={context?.theme || 'light'}
            variant="primary"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </Button>
        </HeaderActions>
      </Header>

      <Content>
        <GanttChart
          tasks={tasks}
          theme={context?.theme || 'light'}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
        />
      </Content>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          boards={boards}
          availableColumns={availableColumns}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
          theme={context?.theme || 'light'}
        />
      )}
    </AppContainer>
  );
};

export default App;
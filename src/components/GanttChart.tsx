import React, { useMemo } from 'react';
import styled from 'styled-components';
import { GanttTask } from '../types';
import GanttBar from './GanttBar';
import GanttHeader from './GanttHeader';
import moment from 'moment';

interface GanttChartProps {
  tasks: GanttTask[];
  theme: 'light' | 'dark';
  onTaskClick?: (task: GanttTask) => void;
  onTaskUpdate?: (taskId: string, startDate: Date, endDate: Date) => void;
}

const GanttContainer = styled.div<{ theme: 'light' | 'dark' }>`
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: ${props => props.theme === 'dark' ? '#292f3a' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#333333'};
  font-family: "Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
`;

const GanttContent = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 1200px;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
`;

const TaskRow = styled.div<{ theme: 'light' | 'dark'; isSubtask?: boolean }>`
  display: flex;
  min-height: 40px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e0e0e0'};
  align-items: center;
  padding-left: ${props => props.isSubtask ? '32px' : '16px'};

  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3a4149' : '#f5f6f8'};
  }
`;

const TaskInfo = styled.div`
  width: 300px;
  padding: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

const TaskName = styled.div<{ isSubtask?: boolean }>`
  font-weight: ${props => props.isSubtask ? '400' : '500'};
  font-size: ${props => props.isSubtask ? '13px' : '14px'};
  color: ${props => props.isSubtask ? '#666' : 'inherit'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TaskMeta = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const GanttTimeline = styled.div`
  flex: 1;
  position: relative;
  min-height: 40px;
`;

const EmptyState = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  text-align: center;
`;

const EmptyStateText = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
`;

const EmptyStateSubtext = styled.div`
  font-size: 14px;
  opacity: 0.7;
`;

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  theme,
  onTaskClick,
  onTaskUpdate
}) => {
  const { validTasks, dateRange, dayWidth } = useMemo(() => {
    const validTasks = tasks.filter(task => task.startDate && task.endDate);

    if (validTasks.length === 0) {
      return { validTasks: [], dateRange: null, dayWidth: 30 };
    }

    const dates = validTasks.reduce((acc, task) => {
      if (task.startDate) acc.push(task.startDate);
      if (task.endDate) acc.push(task.endDate);
      return acc;
    }, [] as Date[]);

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding
    const paddedMinDate = moment(minDate).subtract(7, 'days').toDate();
    const paddedMaxDate = moment(maxDate).add(7, 'days').toDate();

    const totalDays = moment(paddedMaxDate).diff(moment(paddedMinDate), 'days');
    const availableWidth = Math.max(800, window.innerWidth - 350);
    const dayWidth = Math.max(20, availableWidth / totalDays);

    return {
      validTasks,
      dateRange: { start: paddedMinDate, end: paddedMaxDate },
      dayWidth
    };
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: GanttTask[] } = {};
    const orphans: GanttTask[] = [];

    validTasks.forEach(task => {
      const groupKey = task.group || 'No Group';

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      if (task.parentId) {
        // This is a subtask, add it to orphans for now
        orphans.push(task);
      } else {
        groups[groupKey].push(task);
      }
    });

    // Add subtasks after their parents
    orphans.forEach(subtask => {
      Object.values(groups).forEach(groupTasks => {
        const parentIndex = groupTasks.findIndex(task => task.id === subtask.parentId);
        if (parentIndex !== -1) {
          groupTasks.splice(parentIndex + 1, 0, subtask);
        }
      });
    });

    return groups;
  }, [validTasks]);

  if (validTasks.length === 0) {
    return (
      <GanttContainer theme={theme}>
        <EmptyState theme={theme}>
          <EmptyStateText>No timeline data found</EmptyStateText>
          <EmptyStateSubtext>
            Make sure your items have timeline or date columns configured
          </EmptyStateSubtext>
        </EmptyState>
      </GanttContainer>
    );
  }

  return (
    <GanttContainer theme={theme}>
      <GanttContent>
        {dateRange && (
          <GanttHeader
            startDate={dateRange.start}
            endDate={dateRange.end}
            dayWidth={dayWidth}
            theme={theme}
          />
        )}
        <TaskList>
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <React.Fragment key={groupName}>
              {groupTasks.map(task => (
                <TaskRow
                  key={task.id}
                  theme={theme}
                  isSubtask={!!task.parentId}
                >
                  <TaskInfo>
                    <div style={{ flex: 1 }}>
                      <TaskName isSubtask={!!task.parentId}>
                        {task.name}
                      </TaskName>
                      <TaskMeta>
                        {task.boardName} • {groupName}
                        {task.mirrorData && Object.keys(task.mirrorData).length > 0 && (
                          <span> • Mirror data available</span>
                        )}
                      </TaskMeta>
                    </div>
                  </TaskInfo>
                  <GanttTimeline>
                    {dateRange && (
                      <GanttBar
                        task={task}
                        startDate={dateRange.start}
                        dayWidth={dayWidth}
                        theme={theme}
                        onClick={() => onTaskClick?.(task)}
                        onUpdate={onTaskUpdate}
                      />
                    )}
                  </GanttTimeline>
                </TaskRow>
              ))}
            </React.Fragment>
          ))}
        </TaskList>
      </GanttContent>
    </GanttContainer>
  );
};

export default GanttChart;
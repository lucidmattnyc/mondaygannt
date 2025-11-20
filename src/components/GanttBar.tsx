import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { GanttTask } from '../types';
import moment from 'moment';

interface GanttBarProps {
  task: GanttTask;
  startDate: Date;
  dayWidth: number;
  theme: 'light' | 'dark';
  onClick?: () => void;
  onUpdate?: (taskId: string, startDate: Date, endDate: Date) => void;
}

const BarContainer = styled.div<{ left: number; width: number }>`
  position: absolute;
  left: ${props => props.left}px;
  width: ${props => props.width}px;
  height: 24px;
  top: 8px;
  cursor: pointer;
  user-select: none;
`;

const Bar = styled.div<{
  color: string;
  progress: number;
  theme: 'light' | 'dark';
  isDragging?: boolean;
}>`
  width: 100%;
  height: 100%;
  background-color: ${props => props.color};
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  opacity: ${props => props.isDragging ? 0.7 : 1};
  transition: opacity 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

  &:hover {
    opacity: 0.8;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: ${props => props.progress}%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 4px 0 0 4px;
  }
`;

const TaskLabel = styled.div<{ theme: 'light' | 'dark' }>`
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#ffffff'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  max-width: calc(100% - 16px);
`;

const ResizeHandle = styled.div<{ position: 'left' | 'right' }>`
  position: absolute;
  top: 0;
  ${props => props.position}: 0;
  width: 4px;
  height: 100%;
  cursor: ${props => props.position === 'left' ? 'w-resize' : 'e-resize'};
  background-color: rgba(255, 255, 255, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const Tooltip = styled.div<{ theme: 'light' | 'dark' }>`
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : '#333333'};
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: ${props => props.theme === 'dark' ? '#1a1a1a' : '#333333'};
  }
`;

const GanttBar: React.FC<GanttBarProps> = ({
  task,
  startDate,
  dayWidth,
  theme,
  onClick,
  onUpdate
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const dragStartRef = useRef<{ x: number; startDate: Date; endDate: Date } | null>(null);

  if (!task.startDate || !task.endDate) return null;

  const taskStart = moment(task.startDate);
  const taskEnd = moment(task.endDate);
  const ganttStart = moment(startDate);

  const leftOffset = taskStart.diff(ganttStart, 'days') * dayWidth;
  const duration = taskEnd.diff(taskStart, 'days') + 1;
  const width = Math.max(dayWidth * duration, dayWidth * 0.5);

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragType(type);
    dragStartRef.current = {
      x: e.clientX,
      startDate: new Date(task.startDate!),
      endDate: new Date(task.endDate!)
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !onUpdate) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaDays = Math.round(deltaX / dayWidth);

      let newStartDate = new Date(dragStartRef.current.startDate);
      let newEndDate = new Date(dragStartRef.current.endDate);

      switch (type) {
        case 'move':
          newStartDate = moment(dragStartRef.current.startDate).add(deltaDays, 'days').toDate();
          newEndDate = moment(dragStartRef.current.endDate).add(deltaDays, 'days').toDate();
          break;
        case 'resize-left':
          newStartDate = moment(dragStartRef.current.startDate).add(deltaDays, 'days').toDate();
          if (moment(newStartDate).isAfter(newEndDate)) {
            newStartDate = new Date(newEndDate);
          }
          break;
        case 'resize-right':
          newEndDate = moment(dragStartRef.current.endDate).add(deltaDays, 'days').toDate();
          if (moment(newEndDate).isBefore(newStartDate)) {
            newEndDate = new Date(newStartDate);
          }
          break;
      }

      onUpdate(task.id, newStartDate, newEndDate);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const formatDateRange = () => {
    const start = moment(task.startDate).format('MMM DD');
    const end = moment(task.endDate).format('MMM DD');
    const duration = moment(task.endDate).diff(moment(task.startDate), 'days') + 1;
    return `${start} - ${end} (${duration} day${duration !== 1 ? 's' : ''})`;
  };

  const getTooltipContent = () => {
    let content = `${task.name}\n${formatDateRange()}`;

    if (task.progress > 0) {
      content += `\nProgress: ${task.progress}%`;
    }

    if (task.mirrorData && Object.keys(task.mirrorData).length > 0) {
      content += '\n\nMirror Data:';
      Object.values(task.mirrorData).forEach(data => {
        content += `\n${data.sourceColumnTitle}: ${data.displayValue}`;
      });
    }

    return content;
  };

  return (
    <BarContainer
      left={leftOffset}
      width={width}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
    >
      <Bar
        color={task.color || '#037f4c'}
        progress={task.progress || 0}
        theme={theme}
        isDragging={isDragging}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {onUpdate && (
          <>
            <ResizeHandle
              position="left"
              onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
            />
            <ResizeHandle
              position="right"
              onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
            />
          </>
        )}
        {width > 60 && (
          <TaskLabel theme={theme}>
            {task.name}
          </TaskLabel>
        )}
      </Bar>
      {showTooltip && !isDragging && (
        <Tooltip theme={theme}>
          {getTooltipContent().split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </Tooltip>
      )}
    </BarContainer>
  );
};

export default GanttBar;
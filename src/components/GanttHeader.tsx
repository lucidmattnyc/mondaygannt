import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

interface GanttHeaderProps {
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  theme: 'light' | 'dark';
}

const HeaderContainer = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  background-color: ${props => props.theme === 'dark' ? '#3a4149' : '#f5f6f8'};
  border-bottom: 2px solid ${props => props.theme === 'dark' ? '#555' : '#ddd'};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const TaskListHeader = styled.div`
  width: 300px;
  flex-shrink: 0;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
`;

const TimelineHeader = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const MonthRow = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#555' : '#ddd'};
  background-color: ${props => props.theme === 'dark' ? '#2a3038' : '#ffffff'};
  height: 32px;
`;

const DayRow = styled.div`
  display: flex;
  height: 32px;
`;

const MonthCell = styled.div<{ width: number; theme: 'light' | 'dark' }>`
  width: ${props => props.width}px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  border-right: 1px solid ${props => props.theme === 'dark' ? '#555' : '#ddd'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#333333'};
`;

const DayCell = styled.div<{ width: number; theme: 'light' | 'dark'; isWeekend?: boolean }>`
  width: ${props => props.width}px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-right: 1px solid ${props => props.theme === 'dark' ? '#444' : '#eee'};
  background-color: ${props => {
    if (props.isWeekend) {
      return props.theme === 'dark' ? '#3a4149' : '#f8f9fa';
    }
    return 'transparent';
  }};
  color: ${props => {
    if (props.isWeekend) {
      return props.theme === 'dark' ? '#999' : '#666';
    }
    return props.theme === 'dark' ? '#ffffff' : '#333333';
  }};
`;

const GanttHeader: React.FC<GanttHeaderProps> = ({
  startDate,
  endDate,
  dayWidth,
  theme
}) => {
  const days = [];
  const months: { [key: string]: number } = {};

  let currentDate = moment(startDate);
  const end = moment(endDate);

  while (currentDate.isSameOrBefore(end, 'day')) {
    const monthKey = currentDate.format('YYYY-MM');
    if (!months[monthKey]) {
      months[monthKey] = 0;
    }
    months[monthKey]++;

    days.push({
      date: currentDate.clone(),
      day: currentDate.date(),
      month: currentDate.format('MMM'),
      isWeekend: currentDate.day() === 0 || currentDate.day() === 6,
      monthKey
    });

    currentDate.add(1, 'day');
  }

  return (
    <HeaderContainer theme={theme}>
      <TaskListHeader>Tasks</TaskListHeader>
      <TimelineHeader>
        <MonthRow theme={theme}>
          {Object.entries(months).map(([monthKey, dayCount]) => {
            const monthDate = moment(monthKey + '-01');
            return (
              <MonthCell
                key={monthKey}
                width={dayCount * dayWidth}
                theme={theme}
              >
                {monthDate.format('MMM YYYY')}
              </MonthCell>
            );
          })}
        </MonthRow>
        <DayRow>
          {days.map((day, index) => (
            <DayCell
              key={index}
              width={dayWidth}
              theme={theme}
              isWeekend={day.isWeekend}
            >
              {day.day}
            </DayCell>
          ))}
        </DayRow>
      </TimelineHeader>
    </HeaderContainer>
  );
};

export default GanttHeader;
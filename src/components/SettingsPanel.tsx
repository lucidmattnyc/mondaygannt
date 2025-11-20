import React, { useState } from 'react';
import styled from 'styled-components';
import {
  GanttSettings,
  MondayBoard,
  ColorByOption,
  GroupByOption,
  SortByOption
} from '../types';

interface SettingsPanelProps {
  settings: GanttSettings;
  boards: MondayBoard[];
  availableColumns: Array<{id: string, title: string, type: string}>;
  onSettingsChange: (settings: GanttSettings) => void;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Panel = styled.div<{ theme: 'light' | 'dark' }>`
  background-color: ${props => props.theme === 'dark' ? '#292f3a' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#333333'};
  border-radius: 8px;
  padding: 24px;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

const CloseButton = styled.button<{ theme: 'light' | 'dark' }>`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#666666'};
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3a4149' : '#f5f6f8'};
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
`;

const Select = styled.select<{ theme: 'light' | 'dark' }>`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#555' : '#ddd'};
  border-radius: 4px;
  background-color: ${props => props.theme === 'dark' ? '#3a4149' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#333333'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #037f4c;
    box-shadow: 0 0 0 2px rgba(3, 127, 76, 0.2);
  }
`;

const Checkbox = styled.input<{ theme: 'light' | 'dark' }>`
  margin-right: 8px;
  accent-color: #037f4c;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  cursor: pointer;
`;

const BoardList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid ${props => props.theme === 'dark' ? '#555' : '#ddd'};
  border-radius: 4px;
  padding: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary'; theme: 'light' | 'dark' }>`
  padding: 10px 20px;
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
`;

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  boards,
  availableColumns,
  onSettingsChange,
  onClose,
  theme
}) => {
  const [localSettings, setLocalSettings] = useState<GanttSettings>(settings);

  const timelineColumns = availableColumns.filter(col =>
    col.type === 'timeline' || col.type === 'date'
  );

  const colorableColumns = availableColumns.filter(col =>
    ['status', 'color', 'dropdown', 'text'].includes(col.type)
  );

  const groupableColumns = availableColumns.filter(col =>
    ['status', 'dropdown', 'text', 'people', 'team'].includes(col.type)
  );

  const sortableColumns = availableColumns.filter(col =>
    ['text', 'numeric', 'rating', 'date', 'timeline', 'creation_log'].includes(col.type)
  );

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleBoardToggle = (boardId: string, selected: boolean) => {
    const selectedBoards = localSettings.selectedBoards || [];

    if (selected) {
      setLocalSettings({
        ...localSettings,
        selectedBoards: [...selectedBoards, boardId]
      });
    } else {
      setLocalSettings({
        ...localSettings,
        selectedBoards: selectedBoards.filter(id => id !== boardId)
      });
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Panel theme={theme} onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Gantt Chart Settings</Title>
          <CloseButton theme={theme} onClick={onClose}>×</CloseButton>
        </Header>

        <Section>
          <SectionTitle>Boards</SectionTitle>
          <BoardList theme={theme}>
            {boards.map(board => (
              <CheckboxLabel key={board.id}>
                <Checkbox
                  theme={theme}
                  type="checkbox"
                  checked={(localSettings.selectedBoards || []).includes(board.id)}
                  onChange={(e) => handleBoardToggle(board.id, e.target.checked)}
                />
                {board.name}
              </CheckboxLabel>
            ))}
          </BoardList>
        </Section>

        <Section>
          <SectionTitle>Timeline Configuration</SectionTitle>
          <FormField>
            <Label>Timeline Column</Label>
            <Select
              theme={theme}
              value={localSettings.timelineColumn || ''}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                timelineColumn: e.target.value || undefined
              })}
            >
              <option value="">Auto-detect timeline column</option>
              {timelineColumns.map(column => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </Select>
          </FormField>
        </Section>

        <Section>
          <SectionTitle>Display Options</SectionTitle>
          <FormField>
            <Label>Color By</Label>
            <Select
              theme={theme}
              value={localSettings.colorByColumn || ''}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                colorByColumn: e.target.value || undefined
              })}
            >
              <option value="">Use group colors</option>
              {colorableColumns.map(column => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField>
            <Label>Group By</Label>
            <Select
              theme={theme}
              value={localSettings.groupByColumn || ''}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                groupByColumn: e.target.value || undefined
              })}
            >
              <option value="">Use board groups</option>
              {groupableColumns.map(column => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField>
            <Label>Sort By</Label>
            <Select
              theme={theme}
              value={localSettings.sortByColumn || ''}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                sortByColumn: e.target.value || undefined
              })}
            >
              <option value="">Default order</option>
              <option value="name">Item Name</option>
              <option value="start_date">Start Date</option>
              <option value="end_date">End Date</option>
              {sortableColumns.map(column => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </Select>
          </FormField>

          {localSettings.sortByColumn && (
            <FormField>
              <Label>Sort Direction</Label>
              <Select
                theme={theme}
                value={localSettings.sortDirection || 'asc'}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  sortDirection: e.target.value as 'asc' | 'desc'
                })}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Select>
            </FormField>
          )}

          <CheckboxLabel>
            <Checkbox
              theme={theme}
              type="checkbox"
              checked={localSettings.showSubitems || false}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                showSubitems: e.target.checked
              })}
            />
            Show subitems
          </CheckboxLabel>
        </Section>

        <ButtonGroup>
          <Button theme={theme} variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button theme={theme} variant="primary" onClick={handleSave}>
            Save Settings
          </Button>
        </ButtonGroup>
      </Panel>
    </Overlay>
  );
};

export default SettingsPanel;
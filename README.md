# Enhanced Gantt Chart for Monday.com

A powerful dashboard widget that extends Monday.com's native Gantt chart functionality with full mirror column support, enabling advanced visualization and filtering options.

## 🚀 Features

### Core Functionality
- **Full Mirror Column Support**: Unlike Monday.com's default Gantt view, this widget can pull and display any data from mirror columns
- **Enhanced Color Coding**: Color tasks by any column type, including mirror columns with status, color, and dropdown data
- **Advanced Grouping**: Group tasks by any column, including mirror column data from connected boards
- **Flexible Sorting**: Sort by any column type including dates, text, numbers, and mirror column values
- **Subitem Support**: Show and hide subitems with proper hierarchy visualization
- **Real-time Updates**: Automatically sync with Monday.com data changes

### Visual Features
- **Interactive Timeline**: Drag and resize tasks (when editing permissions allow)
- **Responsive Design**: Adapts to different screen sizes and Monday.com themes
- **Hover Tooltips**: Rich tooltips showing task details and mirror column data
- **Progress Visualization**: Visual progress bars on tasks
- **Weekend Highlighting**: Distinguishes weekdays from weekends
- **Theme Support**: Automatic light/dark theme matching with Monday.com

### Data Processing
- **Mirror Column Mapping**: Automatically detects and maps mirror column relationships
- **Multi-Board Support**: Combine data from multiple boards in a single Gantt view
- **Smart Timeline Detection**: Automatically finds timeline columns or allows manual selection
- **Data Validation**: Handles missing or invalid timeline data gracefully

## 🛠 Installation & Setup

### Prerequisites
- Monday.com account with appropriate board permissions
- Node.js 16+ and npm
- Monday Code access (for hosting)

### Local Development

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd monday-gantt-plugin
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your Monday.com app credentials
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

### Monday Code Deployment

1. **Prepare Configuration**
   - Update `mapps.json` with your app details
   - Ensure build output is in the `build` directory

2. **Deploy to Monday Code**
   - Upload your built files to Monday Code
   - Configure your app permissions and scopes
   - Test with your Monday.com boards

## 📋 Usage

### Initial Setup

1. **Add Widget to Dashboard**
   - Go to your Monday.com dashboard
   - Click "Add Widget"
   - Select "Enhanced Gantt Chart"
   - Choose which boards to include

2. **Configure Settings**
   - Click the "Settings" button in the widget header
   - Select boards to display
   - Choose timeline column (or use auto-detection)
   - Configure color by, group by, and sort options
   - Enable/disable subitems

### Mirror Column Features

The widget automatically detects mirror columns and provides enhanced functionality:

- **Color by Mirror Data**: Use status or color columns from connected boards
- **Group by Mirror Data**: Group tasks by any mirror column value
- **Sort by Mirror Data**: Sort tasks using data from mirror columns
- **Mirror Data Tooltips**: Hover over tasks to see mirror column details

### Advanced Configuration

#### Board Selection
- Select multiple boards to combine in one Gantt view
- Each task shows its source board
- Board-specific grouping and coloring options

#### Timeline Configuration
- Auto-detect timeline columns
- Manual timeline column selection
- Support for both timeline and date columns
- Handles missing timeline data gracefully

#### Display Options
- **Color By**: Choose any column to color-code tasks
- **Group By**: Organize tasks by any column value
- **Sort By**: Order tasks by any sortable column
- **Show Subitems**: Toggle subitem visibility

## 🔧 API Integration

### Monday.com GraphQL API

The widget uses Monday.com's GraphQL API to fetch:
- Board structures and columns
- Item data and column values
- Mirror column mappings and source data
- Group and board metadata

### Key API Queries

- `boards` - Fetch board structure and columns
- `items` - Get items with all column values
- Mirror column resolution through column settings
- Automatic permission handling and error management

## 🎨 Customization

### Styling
- Styled-components for theme-aware styling
- CSS-in-JS for dynamic theming
- Monday.com design system compliance
- Responsive breakpoints included

### Data Processing
- Extend `dataProcessor.ts` for custom data transformations
- Add new column type support
- Implement custom sorting algorithms
- Extend mirror column mapping logic

## 🐛 Troubleshooting

### Common Issues

**No Timeline Data Found**
- Ensure items have timeline or date columns
- Check timeline column configuration in settings
- Verify board permissions

**Mirror Columns Not Working**
- Confirm mirror columns are properly configured in Monday.com
- Check source board permissions
- Verify mirror column mappings in settings

**Performance Issues**
- Limit number of boards and items
- Use board filtering in widget settings
- Consider pagination for large datasets

### Debug Mode
Enable debug logging by setting `REACT_APP_DEBUG=true` in your environment.

## 📈 Roadmap

### Planned Features
- **Baseline Comparison**: Compare current timeline to baseline
- **Critical Path**: Highlight critical path in project
- **Export Options**: PDF and Excel export functionality
- **Real-time Collaboration**: Live updates as team members make changes
- **Custom Views**: Save and share different Gantt configurations
- **Resource Management**: Track resource allocation across tasks

### Enhancements
- **Performance Optimization**: Faster loading for large datasets
- **Mobile Support**: Touch-friendly interaction on mobile devices
- **Advanced Filtering**: Complex filter conditions and saved filters
- **Integration APIs**: Connect with external project management tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Monday.com for their comprehensive API and SDK
- The Monday.com developer community for examples and support
- Contributors and users providing feedback and feature requests

## 📞 Support

For support, email your-email@domain.com or create an issue in this repository.

---

**Built with ❤️ for the Monday.com community**
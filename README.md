# Landr

A customizable browser homepage with widgets, themes, and extensibility.

## Features

- 🎨 **Animated Gradient Background** 
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 🔍 **Quick Search** - Search with Google, Bing, or DuckDuckGo
- 🔗 **Custom Quick Links** - Add your favorite websites
- ✅ **Task Manager** - Keep track of your to-dos
- 🎵 **Music Visualizer** - Upload audio files or use your microphone
- 🧩 **Addon Store** - Extend functionality with custom scripts

## Developer Features

### Custom Scripts

Upload JavaScript files to extend Landr's functionality through the Developer settings.

#### Available API

```javascript
// Show notifications
LandrAPI.showNotification(message, type); // type: 'info', 'success', 'warning', 'error'

// Add tasks
LandrAPI.addTodo('Task description');

// Add quick links
LandrAPI.addQuickLink('Name', 'https://example.com');
```

### Addon Store

Install community scripts directly from the [scriptstore](scriptstore/) folder. The store automatically fetches available addons from GitHub.

## Contributing

Feel free to submit addons to the `scriptstore/` folder via pull request.

## Credits

Created with ♥ by **Skye**

## License

MIT

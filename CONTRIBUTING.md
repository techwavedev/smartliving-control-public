# Contributing to SmartLiving Control

Thank you for your interest in contributing to SmartLiving Control!

## Development Setup

1. **Prerequisites**
   - Node.js 18+
   - npm

2. **Clone and Install**

   ```bash
   git clone https://github.com/techwavedev/smartliving-control.git
   cd smartliving-control
   npm install
   ```

3. **Run in Development**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── main/
│   ├── main.js      # Electron main process
│   └── preload.js   # Secure bridge to renderer
├── renderer/
│   ├── index.html   # UI markup
│   ├── style.css    # Styles
│   └── app.js       # UI logic
└── services/
    ├── smartthings.js     # SmartThings API client
    └── deviceTypes.js     # Device type mappings
```

## Testing

```bash
npm test
```

## Building

```bash
npm run build
```

Outputs are placed in `dist/`.

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Code Style

- Use 2-space indentation
- Run `npm run lint` before committing
- Follow existing patterns in the codebase

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

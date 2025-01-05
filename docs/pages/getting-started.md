# Getting Started

## Prerequisites
Before you begin, ensure you have:
- Visual Studio Code installed (version 1.76.0 or higher)
- [Code for IBM i](https://marketplace.visualstudio.com/items?itemName=HalcyonTechLtd.code-for-ibmi) extension installed and configured
- Access to an IBM i system with appropriate permissions

## Installation

1. Open Visual Studio Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS) to open the Extensions view
3. Search for "Arcad Transformer-RPG"
4. Click **Install**
5. Once installed, restart Visual Studio Code if prompted

## Configuration

1. `Connect to IBM i`:
   - Open Command Palette (`F1` or `Ctrl+Shift+P`)
   - Type `Code for IBM i: Connect`
   - Enter your credentials when prompted

2. `Configure Object Browser`:
   - Navigate to the IBM i Object Browser view
   - Click `+ Create new filter`
   - Configure the following settings:
     - Library name
     - Object type (default: *FILE)
     - Object name pattern
   - Click **Save**

3. `Start Using`:
   - Expand your saved filter in the Object Browser
   - Browse and select source members to transform
   - Right-click on a member to see available Transformer actions

> Note: For detailed configuration options and troubleshooting, see the [Configuration Guide](./configuration.md).




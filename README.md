# EMSApp - Emergency Medical Services Mobile Application

A cross-platform mobile application built with **Expo SDK 54** and **React Native** for Emergency Medical Services (EMS) professionals.

## 🚀 Features

- **Cross-platform compatibility** - Works seamlessly on both iOS and Android
- **Modern UI/UX** - Beautiful gradient designs and smooth animations
- **Tab-based navigation** - Intuitive navigation with stack navigation
- **Responsive design** - Adapts to different screen sizes and orientations
- **Expo Go compatible** - Test instantly on your device during development

## 📱 Current Screens

- **Home Screen** - Welcome screen with feature cards and navigation
- **Details Screen** - Detailed view of selected features and functionality
- **Profile Screen** - User profile with stats, achievements, and account info
- **Settings Screen** - App configuration, preferences, and system settings

## 🛠 Tech Stack

- **Expo SDK**: 54.0.10 (Latest)
- **React Native**: 0.81.4
- **React**: 19.1.0
- **React Navigation**: v7 (Bottom Tabs + Stack Navigation)
- **Expo Linear Gradient**: Beautiful gradient backgrounds
- **Expo Vector Icons**: Consistent Ionicons throughout the app

## 🏗 Project Structure

```
EMSApp/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Application screens
│   │   ├── HomeScreen.js
│   │   ├── DetailsScreen.js
│   │   ├── ProfileScreen.js
│   │   └── SettingsScreen.js
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.js
│   ├── constants/          # App constants and themes
│   │   ├── Colors.js
│   │   └── Layout.js
│   └── utils/             # Utility functions and helpers
│       └── helpers.js
├── assets/                 # Images, icons, and static assets
├── App.js                 # Main application entry point
├── app.json              # Expo configuration
└── package.json          # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Expo Go** app on your mobile device

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd EMSApp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```
   or
   ```bash
   expo start
   ```

4. **Test on your device**:
   - Install **Expo Go** from App Store (iOS) or Google Play (Android)
   - Scan the QR code displayed in your terminal or browser
   - The app will load instantly on your device

### Development Scripts

- `npm start` - Start Expo development server with QR code
- `npm run android` - Start on Android emulator/device
- `npm run ios` - Start on iOS simulator/device  
- `npm run web` - Start web version in browser

## 📱 Testing on Physical Devices

### iOS Testing
- Install **Expo Go** from the App Store
- Open the Camera app and scan the QR code
- Or open Expo Go and scan the QR code directly

### Android Testing
- Install **Expo Go** from Google Play Store
- Open Expo Go and scan the QR code
- The app will download and run instantly

## 🎨 Customization

### Theme & Colors
Edit `src/constants/Colors.js` to customize the app's color scheme and gradients.

### Layout & Spacing
Modify `src/constants/Layout.js` for consistent spacing, sizes, and layout constants.

### Navigation Structure
Update `src/navigation/AppNavigator.js` to add new screens or modify navigation flow.

### App Configuration
Edit `app.json` to change app name, icon, splash screen, and platform-specific settings.

## 📦 Key Dependencies

```json
{
  "expo": "~54.0.10",
  "react": "19.1.0",
  "react-native": "0.81.4",
  "@react-navigation/native": "^7.1.17",
  "@react-navigation/bottom-tabs": "^7.4.7",
  "@react-navigation/stack": "^7.4.8",
  "expo-linear-gradient": "~15.0.7",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "~5.6.0"
}
```

## 🔧 Expo SDK 54 Features

This app leverages the latest Expo SDK 54 features:
- ✅ **New Architecture** support enabled
- ✅ **Edge-to-edge** Android support
- ✅ Latest **React Native 0.81.4**
- ✅ Updated dependency versions for optimal compatibility
- ✅ Enhanced performance and stability

## 🚀 Deployment Options

### Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all

# Submit to app stores
eas submit --platform all
```

### Web Deployment
```bash
# Build for web
expo export:web

# Deploy to Netlify, Vercel, or your preferred hosting service
```

### Development Build
```bash
# Create development build for testing
eas build --profile development --platform all
```

## 🔒 Security & Best Practices

- All sensitive data should be stored securely
- API keys should be stored in environment variables
- Follow HIPAA compliance guidelines for medical data
- Implement proper authentication and authorization
- Use secure communication protocols (HTTPS/WSS)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Test on both iOS and Android devices
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

## 📋 Development Roadmap

- [ ] Add EMS-specific features and workflows
- [ ] Implement user authentication and profiles
- [ ] Add offline data synchronization
- [ ] Integrate with medical devices and sensors
- [ ] Add real-time communication features
- [ ] Implement data analytics and reporting
- [ ] Add multi-language support
- [ ] Enhance accessibility features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [Expo SDK 54 Release Notes](https://blog.expo.dev/expo-sdk-54-is-now-available-9a4e2b8e1a3a)

## 📞 Contact

For questions, issues, or contributions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for EMS professionals using Expo SDK 54 and React Native**

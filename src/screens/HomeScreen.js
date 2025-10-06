import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const features = [
    {
      id: 1,
      title: 'Voice Report Generator',
      description: 'Create field reports using voice recording',
      icon: 'mic-outline',
      color: ['#667eea', '#764ba2'],
      screen: 'VoiceReport',
    },
    {
      id: 2,
      title: 'Emergency Response',
      description: 'Quick access to emergency protocols',
      icon: 'medical-outline',
      color: ['#ff6b6b', '#ee5a52'],
    },
    {
      id: 3,
      title: 'Patient Records',
      description: 'Secure patient information management',
      icon: 'document-text-outline',
      color: ['#4ecdc4', '#44a08d'],
    },
    {
      id: 4,
      title: 'Communication',
      description: 'Team coordination and dispatch',
      icon: 'chatbubbles-outline',
      color: ['#45b7d1', '#96c93d'],
    },
  ];

  const handleFeaturePress = (feature) => {
    if (feature.screen === 'VoiceReport') {
      navigation.navigate('VoiceReport');
    } else {
      navigation.navigate('Details', { feature });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Welcome to OnScene</Text>
          <Text style={styles.headerSubtitle}>
            Emergency Medical Services Platform
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={feature.color}
                style={styles.featureGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.featureContent}>
                  <Ionicons 
                    name={feature.icon} 
                    size={32} 
                    color="white" 
                    style={styles.featureIcon}
                  />
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color="white" 
                    style={styles.chevron}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Ready for Field Use</Text>
            <Text style={styles.infoText}>
              OnScene is designed for emergency medical professionals. 
              Access critical tools and information when you need them most.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  featureCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  featureGradient: {
    padding: 20,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chevron: {
    marginLeft: 8,
  },
  infoSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

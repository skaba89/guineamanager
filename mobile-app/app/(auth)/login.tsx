/**
 * GuinéaManager Mobile - Login Screen
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const success = await login(email, password);
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#059669' }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingTop: 80,
          paddingBottom: 40,
        }}>
          {/* Logo */}
          <View style={{ 
            width: 80, 
            height: 80, 
            backgroundColor: 'white', 
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#059669' }}>GM</Text>
          </View>
          
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
            GuinéaManager
          </Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>
            ERP pour PME en Afrique
          </Text>
        </View>

        {/* Form */}
        <View style={{ 
          flex: 2, 
          backgroundColor: 'white', 
          borderTopLeftRadius: 32, 
          borderTopRightRadius: 32,
          paddingHorizontal: 24,
          paddingTop: 32,
        }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
            Connexion
          </Text>
          <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
            Connectez-vous à votre compte
          </Text>

          {/* Error message */}
          {error ? (
            <View style={{ 
              backgroundColor: '#fef2f2', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 16 
            }}>
              <Text style={{ color: '#dc2626' }}>{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            />
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
              Mot de passe
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: 18 }}
              >
                <Text style={{ color: '#6b7280' }}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
              <Text style={{ color: '#059669', fontWeight: '500' }}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={{
              backgroundColor: '#059669',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                Se connecter
              </Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 40 }}>
            <Text style={{ color: '#6b7280' }}>Pas encore de compte ? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={{ color: '#059669', fontWeight: '600' }}>S'inscrire</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

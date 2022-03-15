import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'intl';
import 'intl/locale-data/jsonp/pt-BR';

import React from 'react';
import { StatusBar } from 'react-native'; 
import { ThemeProvider } from 'styled-components';
import AppLoading from 'expo-app-loading';

import theme from './src/global/styles/theme'

import { Routes } from './src/routes';

import { AuthProvider, useAuth } from './src/hooks/auth';

import {
  useFonts, 
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';



export default function App() {

  // carrega as fontes do App
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold
  });

  // 
  const { userStorageLoading } = useAuth();

  // enquanto as fontes não foram carregadas, segura a tela
  // ou enquanto carrega o usuário do AsyncStorage, segura a tela
  if(!fontsLoaded || userStorageLoading){
    return <AppLoading />
  }

  // AuthContext aqui é o Valor atual

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider theme={theme}>        
          <StatusBar  barStyle='light-content'/>              
            <AuthProvider>
              <Routes />
            </AuthProvider>        
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}




import React, { 
    createContext, 
    ReactNode, 
    useContext,
    useState,
    useEffect
} from 'react';

import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthProviderProps {
    children: ReactNode;
}

interface User {
    id: string;
    name: string;
    email: string;
    photo?: string;
}

interface IAuthContextData{
    user: User;
    signInWithGoogle(): Promise<void>; 
    sigiInWithApple(): Promise<void>; 
    signOut(): Promise<void>;
    userStorageLoading: boolean;
}


interface AuthorizathionResponse {
    params: {
        access_token: string;
    };
    type: string;
}

interface InfoToken{
    id: string;
    email: string;
    given_name: string;
    picture: string;
}

const { CLIENT_ID } = process.env;

const { REDIRECT_URI } = process.env;

// Cria o contexto de usuário com o tipo IAuthContextData.
const AuthContext = createContext({} as IAuthContextData);


function AuthProvider( { children }: AuthProviderProps ){

    // Chave de acesso ao AsyncStorage
    const userStorageKey = '@gofinances:user';

    // estado para armazenar o usuário.
    const [user, setUser] = useState<User>({} as User);

    // estado para armazenar se está fazendo loading do AsyncStorage
    const [userStorageLoading, setUserStorageLoading] = useState(true); 

    // função para fazer a autenticação com o Google
    async function signInWithGoogle() {
        
        try {
            // Variáveis de configuração, fornecer para URL de autenticação:
            // const CLIENT_ID = '366403883701-7sh1n94pq98cbdu11b3i2pmu3tbbrnqs.apps.googleusercontent.com';
            // const REDIRECT_URI = 'https://auth.expo.io/@marlonkleinschmidt/gofinances';
            const RESPONSE_TYPE = 'token';
            const SCOPE = encodeURI('profile email');

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`; 
            
            const { type, params } = await AuthSession
                .startAsync({ authUrl }) as AuthorizathionResponse;

            // se deu sucesso temos o token, e com ele buscar as informações do user    
            if(type === 'success'){
                
                // fecth() é próprio do javascript usado para consumir end points e fazer requisições http.
                const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${params.access_token}`);

                const result : InfoToken = await response.json();

                const userLogged = {
                    id: result.id,
                    email: result.email,
                    name: result.given_name,
                    photo: result.picture       
                }
                setUser(userLogged);
                await AsyncStorage.setItem(userStorageKey,JSON.stringify(userLogged));
                
                console.log(user);
            }   

        } catch (error) {
            console.log(error);
            throw new Error('error');                       
        }
    }

    // função para fazer a autenticação com a Apple
    async function sigiInWithApple() {
        
        try {
            
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ]
            });

            if(credential){
                const name = credential.fullName!.givenName!;
                const photo = `https://ui-avatars.com/api/?name=${name}&length=1`;
                const userLogged = {
                    id: String(credential.user),
                    email: credential.email!,
                    name,
                    photo 
                };
                setUser(userLogged);
                await AsyncStorage.setItem(userStorageKey,JSON.stringify(userLogged));
            }            

        } catch (error) {
            throw new Error('error');
        }
    }

    // função que realiza o logout da aplicação.
    async function signOut() {
    
        // reset no estado do usuário autenticado
        setUser({} as User);

        // remover o usuário autenticado do AsyncStorage        
        await AsyncStorage.removeItem(userStorageKey);

    }


    // useEffect para obter as informações do usuário autenticado que estão
    // armazenadas no AsyncStorage.
    useEffect(()=> {

        async function loadUserStorageDate() {
            
            // atribui/despeja as informações do usuário obtido do AsyncStorage.
            const userStorage = await AsyncStorage.getItem(userStorageKey);

            // caso exista usuário, gravar no estado User.
            if( userStorage ){                
                const userLogged = JSON.parse(userStorage) as User;
                // atualiza estado.
                setUser(userLogged);
            }

            // termina o loading do AsyncStorage
            setUserStorageLoading(false);
        }

        // chama a função loadUserStorageDate para realizar a busca no AsyncStorage. 
        loadUserStorageDate();

    },[]);


    return (
        <AuthContext.Provider value={{ 
            user, 
            signInWithGoogle,
            sigiInWithApple,
            signOut,
            userStorageLoading            
        }}>
            { children }
        </AuthContext.Provider>        
    );
}

// retorna o contexo do usuário, com o tipo IAuthContextData {user,signInWithGoogle,sigiInWithApple}    
function useAuth(){
    const context = useContext(AuthContext);
    return context;
}

// Exporta as funções AuthProvider, useAuth.
export { AuthProvider, useAuth }

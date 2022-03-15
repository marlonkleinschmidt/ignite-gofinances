import React, { useContext, useState } from 'react';
import { ActivityIndicator, Alert, Platform } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from 'styled-components';
import AppleSvg from '../../assets/apple.svg';
import GooleSvg from '../../assets/google.svg';
import LogoSvg from '../../assets/logo.svg';

import { useAuth } from '../../hooks/auth';

import { SingInSocialButton } from '../../components/SignInSocialButton';

import { 
    Container,
    Header,
    TitleWrapper,
    Title,
    SigInTitle,
    Footer,
    FooterWrapper,

} from './styles';


export function SignIn(){

    // fazer um loading quando o usuário clicar no botao de login
    const [isLoading, setIsLoading] = useState(false);

    const { signInWithGoogle, sigiInWithApple } = useAuth();
    
    const theme = useTheme();

    async function handleSignInWithGoogle() {
        
        try {     
            setIsLoading(true);   
            return await signInWithGoogle();
        } catch (error) {
            console.log(error);
            Alert.alert('Não foi possível conectar a conta Google');
            setIsLoading(false); 
        }         
    }

    async function handleSignInWithApple() {
        
        try {     
            setIsLoading(true);    
            return await sigiInWithApple();
        } catch (error) {
            console.log(error);
            Alert.alert('Não foi possível conectar a conta Apple');
            setIsLoading(false);
        }
    }
    
    return (
        <Container>
            <Header>
                <TitleWrapper>
                    <LogoSvg 
                        width={RFValue(120)}
                        height={RFValue(68)}
                    />
                    <Title>
                        Controle suas {'\n'}
                        finanças de forma {'\n'}
                        muito simples 
                    </Title>
                </TitleWrapper>  

                <SigInTitle>
                    Faça seu login com {'\n'}
                    uma das contas abaixo 
                </SigInTitle>  
            </Header>        

            <Footer>
                <FooterWrapper>
                    <SingInSocialButton 
                        title='Entrar com o Goole'
                        svg={GooleSvg}
                        onPress={handleSignInWithGoogle}
                    />
                    {
                       Platform.OS === 'ios' &&    
                       <SingInSocialButton 
                            title='Entrar com o Apple'
                            svg={AppleSvg}
                            onPress={handleSignInWithApple}
                        />     
                    }
                    
                </FooterWrapper>

                { isLoading && 
                    <ActivityIndicator 
                        color={theme.colors.shape}  
                        style={{marginTop: 18}}
                    /> 
                }
            </Footer>
        </Container>
    );
}
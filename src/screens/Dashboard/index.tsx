import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';
import { useAuth } from '../../hooks/auth';

import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';

import { 
    Container,
    Header,
    UserWrapper,
    UserInfo,
    Photo,
    User,
    UserGreeting,
    UserName,
    LogoutButton,
    Icon,
    HighlightCards,
    Transactions,
    Title,
    TransactionList,
    LoadContainer
} from './styles';

// tipar a transação
export interface DataListProps extends TransactionCardProps{
    id: string;
}

// tipar
interface highlightProps {
    amount: string;
    lastTransaction: string;
}

// tipar 
interface highlightData {
    entries: highlightProps;
    expensives: highlightProps;    
    total: highlightProps;
}


export function Dashboard(){
   
    // estado para armazenar o processo de renderização da tela.
    const [ isLoading, setIsLoading ] = useState(true);
    // estado para armazenar as transactions do AsyncStorage.
    const [transactions, setTransactions] = useState<DataListProps[]>([]);
    
    const [highlightData, setHighlightData] = useState<highlightData>({} as highlightData);

    const theme = useTheme();

    const { signOut, user } = useAuth();

    // função para formatar a ultima data da transação
    function getLastTransactionDate(
        collection: DataListProps[],
        type: 'positive' | 'negative'        
    ){

        // filtra as transações por tipo 'positive' | 'negative'
        const collectionFilttered = collection
        .filter(transaction  => transaction.type === type);    

        // se não possuir transações para o tipo
        if (collectionFilttered.length === 0)
            return 0;     
       

        // Filtrar as transações pegar a última    
        const lastTransaction =  new Date(           
        Math.max.apply(Math, collectionFilttered    
        .map(transaction => new Date(transaction.date).getTime())))

        return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR',{ month: 'long' })}`;
    }    


    // função que faz a leitura dos dados do AsyncStorage.
    async function loadTransaction() {

        // chave para acessar a coleção no AsyncStorage.
        const dataKey = `@gofinances:transactions_user:${user.id}`;        
        // Obtem os dados do AsyncStorage e coloca em response.
        const response = await AsyncStorage.getItem(dataKey);
        // Se tiver dados, monta o array com as transações.
        const transactions = response ? JSON.parse(response): [];

        // calcular as transações de entrada.
        let entriesTotal = 0;

        // calcular as transações de saída.
        let expensiveTotal = 0;

        // Percorrer cada item do array de transações, utilizando o .map,
        // para formatar os dados do array obtido do asyncstorage.        
        const transactionsFormatted : DataListProps[] = transactions
            .map((item : DataListProps ) => {
               
                // Calcula totais de transações E / S
                if(item.type === 'positive'){
                    entriesTotal += Number(item.amount);
                } else {
                    expensiveTotal += Number(item.amount);
                }    

                // formata a propriedade amount -> R$ 12.500,00
                const amount = Number(item.amount)
                    .toLocaleString('pt-BR',{ 
                        style: 'currency',
                        currency: 'BRL'
                    });
                 
                // formata a propriedade date -> 08/03/22    
                const date = Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                }).format(new Date(item.date));
            
                // após percorrer e formatar os itens do array, retorna com
                // os novos valores.
                return {
                    id: item.id,
                    name: item.name,
                    amount,
                    type: item.type,
                    category: item.category,
                    date,
                }            
            });

        // Salva no estado data o array com as transações formatado.
        setTransactions(transactionsFormatted);    


        const lastTransactionEntries = getLastTransactionDate(transactions,'positive');
        const lastTransactionExpensives = getLastTransactionDate(transactions,'negative');
       
       
        const totalInterval = lastTransactionExpensives === 0 
        ? 'Não há transações'
        :`01 a ${lastTransactionExpensives}`;    


        const total = entriesTotal - expensiveTotal;

        setHighlightData({
            entries: {
                amount: entriesTotal.toLocaleString('pt-BR',{
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: lastTransactionEntries === 0 
                ? 'Não há transações' 
                :`Última entrada dia ${lastTransactionEntries}`,
            },
            expensives: {
                amount: expensiveTotal.toLocaleString('pt-BR',{
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: lastTransactionExpensives === 0 
                ? 'Não há transações'
                : `Última saída dia ${lastTransactionExpensives}`,
            },
            total: {
                amount: total.toLocaleString('pt-BR',{
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: totalInterval
            }
        });      
       
        setIsLoading(false);
    }


    // carrega as transações do asyncstorage atraves da função loadTransaction()
    //*useEffect( () =>{
      //  loadTransaction();
        //AsyncStorage.removeItem('@gofinances:transactions'); ***LIMPA AsyncStorage ***
    //},[]);

    // recarrega a tela quando retorna da tela de cadastro, quando recebe o
    // foco novamente.
    useFocusEffect(useCallback(() => {
        loadTransaction();
    },[]));

    return (
        <Container>
            
            {
                isLoading ? 
                <LoadContainer>
                    <ActivityIndicator 
                        color={theme.colors.primary}
                        size="large"
                    />
                </LoadContainer> :       
                <> 
                    <Header>
                        <UserWrapper>
                            <UserInfo>
                                <Photo 
                                    source={{uri: user.photo }}
                                />
                                <User>
                                    <UserGreeting>Olá,</UserGreeting>
                                    <UserName>{user.name}</UserName>
                                </User>
                            </UserInfo>   
                            <LogoutButton onPress={signOut}>
                                <Icon name="power"/>
                            </LogoutButton>    

                        </UserWrapper>                
                    </Header>

                    <HighlightCards>
                        <HighlightCard 
                            type='up'
                            title='Entradas'
                            amount={ highlightData.entries.amount } 
                            lastTransaction={ highlightData.entries.lastTransaction }    
                        />
                        <HighlightCard 
                            type='down'
                            title='Saídas'
                            amount={ highlightData.expensives.amount } 
                            lastTransaction={ highlightData.expensives.lastTransaction }    
                        />
                        <HighlightCard
                            type='total'
                            title='Total'
                            amount={ highlightData.total.amount }
                            lastTransaction={ highlightData.total.lastTransaction }    
                        />
                    </HighlightCards>

                    <Transactions>
                    <Title>Listagem</Title>

                    <TransactionList 
                            data={transactions}               
                            keyExtractor={ item => item.id }
                            renderItem={({ item }) => <TransactionCard data={item} />}                    
                        />     
                        
                    </Transactions>
                </>
            }           

        </Container>
    )
}


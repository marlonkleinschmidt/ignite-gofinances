import React, {useCallback, useEffect, useState} from 'react';
import { ActivityIndicator } from 'react-native';
import  AsyncStorage  from '@react-native-async-storage/async-storage';
import { HistoryCard } from '../../components/HistoryCard';
import { categories } from '../../utils/categories';
import { VictoryPie } from 'victory-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR} from 'date-fns/locale';

import { useAuth } from '../../hooks/auth';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from 'styled-components';

import { 
    Container,
    Header,
    Title,  
    MonthSelect,
    MonthSelectButton,
    MonthSelectIcon,
    Month,    
    Content,
    ChartContainer,
    LoadContainer  
} from './styles';



interface TransactionData {    
    type: 'positive' | 'negative';
    name: string;
    amount: string;
    category: string;
    date: string;
}

interface CategoryData{
    key: string;
    name: string;
    total: number;
    totalFormatted: string;
    color: string;
    percent: string;
}

export function Resume(){

    const [isLoading, setIsLoading] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());

    const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>([]);

    const theme = useTheme();

    const { user } = useAuth();
    

    function handleDataChange(action: 'next' | 'prev'){

        if(action === 'next'){            
            setSelectedDate(addMonths(selectedDate,1));
        }else{            
            setSelectedDate(subMonths(selectedDate,1));
        }

    }

    async function loadData() {
        
        setIsLoading(true);
        const dataKey = `@gofinances:transactions_user:${user.id}`;
        const response = await AsyncStorage.getItem(dataKey);           
        const responseFormatted = response ? JSON.parse(response) : [];

        // filtar as transações de saída
        const expensives = responseFormatted
        .filter((expensive:TransactionData) => 
            expensive.type === 'negative' && 
            new Date(expensive.date).getMonth() === selectedDate.getMonth() &&
            new Date(expensive.date).getFullYear() === selectedDate.getFullYear()
        );

        
        
        
        
        
        // reduce é pra fazer a soma, pegar uma coleção e somar os elementos
        // reduce tem 2 parâmetros primeiro é o acumullator e o segundo é o valor inicial
        // expensivesTotal - Pegar o total de todas as despesas para calcular o percentual
        // por categoria
        const expensivesTotal = expensives
        .reduce((acumullator: number, expensive: TransactionData) => {
            return acumullator + Number(expensive.amount);    
        },0);   

        // array de totais [{nome, total}]
        const totalByCategory: CategoryData[] = [];

        // temos 6 categorias no arquivo categories           
        categories.forEach(category => {
            let categorySum = 0;

            // pra cada categoria, percorrer todos os gastos
            // e verificar se é igual a categoria, se for, soma o gasto
            expensives.forEach((expensive:TransactionData) => {
                if(expensive.category === category.key){
                    categorySum += Number(expensive.amount);
                }
            });
            
            if(categorySum > 0){
                const totalFormatted = categorySum
                    .toLocaleString('pr-BR',{
                        style: 'currency',
                        currency: 'BRL'
                });

                const percent = `${(categorySum / expensivesTotal * 100).toFixed(0)}%`;

                // Armazena no vetor, o nome e o total da categoria.
                totalByCategory.push({
                    key: category.key,
                    name: category.name,
                    color:category.color,
                    total: categorySum,         
                    totalFormatted,   
                    percent       
                });
            }   
        }); 

        setTotalByCategories(totalByCategory);        
        setIsLoading(false);
    }

    useFocusEffect(useCallback(() => {
        loadData();
    },[selectedDate]));

    return (
        <Container>
            <Header>
                    <Title>Resumo por categoria</Title>
                </Header> 
            {
            isLoading ? 
                <LoadContainer>
                    <ActivityIndicator 
                        color={theme.colors.primary}
                        size="large"
                    />
                </LoadContainer> :   
                
                <Content
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingBottom: useBottomTabBarHeight()
                    }}

                >

                    <MonthSelect>
                        <MonthSelectButton onPress={()=> handleDataChange('prev')}>
                            <MonthSelectIcon name='chevron-left'/>
                        </MonthSelectButton>
                        <Month>{format(selectedDate, 'MMMM, yyyy', {locale: ptBR})}</Month>

                        <MonthSelectButton onPress={()=> handleDataChange('next')}>
                            <MonthSelectIcon name='chevron-right'/>
                        </MonthSelectButton>
                    </MonthSelect>

                    <ChartContainer>
                    <VictoryPie 
                            data={totalByCategories}
                            colorScale={totalByCategories.map(category=> category.color)}
                            style={{
                                labels: { 
                                    fontSize: RFValue(18),
                                    fontWeight: 'bold',
                                    fill: theme.colors.shape,
                                }
                            }}
                            labelRadius={50}
                            x='percent'
                            y='total'
                        />
                    </ChartContainer>                
                    {    
                        totalByCategories.map(item => (
                            <HistoryCard 
                                key={item.key}
                                title={item.name}             
                                amount={item.totalFormatted}
                                color={item.color}                
                            />
                        ))                    
                    }       
                    </Content>   
                    
            }
        </Container>
    );
}
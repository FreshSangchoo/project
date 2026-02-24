package com.apink.rankingservice.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource.ranking-service")
    public DataSourceProperties rankingServiceDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Primary
    @Bean("rankingServiceDataSource")
    public DataSource rankingServiceDataSource() {
        return rankingServiceDataSourceProperties()
                .initializeDataSourceBuilder()
                .build();
    }

    @Primary
    @Bean(name = "transactionManager")
    public PlatformTransactionManager rankingTransactionManager(@Qualifier("rankingServiceDataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    @Bean
    @ConfigurationProperties("spring.datasource.main-service")
    public DataSourceProperties mainServiceDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean("mainServiceDataSource")
    public DataSource mainServiceDataSource() {
        return mainServiceDataSourceProperties()
                .initializeDataSourceBuilder()
                .build();
    }

    @Bean(name = "mainTransactionManager")
    public PlatformTransactionManager mainTransactionManager(@Qualifier("mainServiceDataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
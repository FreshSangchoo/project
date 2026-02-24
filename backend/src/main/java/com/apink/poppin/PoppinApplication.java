package com.apink.poppin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableMongoRepositories(basePackages = "com.apink.poppin.api.chat.repository")
@EnableMongoAuditing
public class PoppinApplication {

	public static void main(String[] args) {
		SpringApplication.run(PoppinApplication.class, args);
	}

}

package com.smartchat.autoweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(scanBasePackages = {"com.smartchat.autoweb", "com.ehs.web"})
@EnableAsync
public class AutoWebSpringbootApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutoWebSpringbootApplication.class, args);
    }
}

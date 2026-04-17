package com.smartchat.autoweb.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.project-root:../}")
    private String projectRoot;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(false);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/static/**")
                .addResourceLocations(
                        "file:" + projectRoot + "/static/",
                        "classpath:/static/"
                );             
        registry.addResourceHandler("/pages/**")
                .addResourceLocations(
                        "file:" + projectRoot + "/templates/",
                        "classpath:/templates/"
                );
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Serve legacy front-end pages as static HTML to avoid Thymeleaf parsing conflicts.
        registry.addViewController("/ehs").setViewName("forward:/pages/ehs/index.html");
        registry.addViewController("/ehs/").setViewName("forward:/pages/ehs/index.html");
        registry.addViewController("/ssh").setViewName("forward:/pages/ssh/ssh_download.html");
        registry.addViewController("/ssh/").setViewName("forward:/pages/ssh/ssh_download.html");
        registry.addViewController("/ehs/index").setViewName("forward:/pages/ehs/autoUpload.html");
        registry.addViewController("/ehs/index/").setViewName("forward:/pages/ehs/autoUpload.html");
        registry.addViewController("/ehs/taskImg").setViewName("forward:/pages/ehs/taskImg.html");
        registry.addViewController("/ehs/taskImg/").setViewName("forward:/pages/ehs/taskImg.html");
        registry.addViewController("/ehs/watermark").setViewName("forward:/pages/ehs/watermark.html");
        registry.addViewController("/system").setViewName("forward:/pages/ehs/monitor.html");
        registry.addViewController("/system/").setViewName("forward:/pages/ehs/monitor.html");
        registry.addViewController("/ehs/chunk").setViewName("forward:/pages/ehs/chunkUpload.html");
        registry.addViewController("/ehs/chunk/").setViewName("forward:/pages/ehs/chunkUpload.html");
        registry.addViewController("/router").setViewName("forward:/pages/api/explorer.html");
        registry.addViewController("/explorer").setViewName("forward:/pages/api/explorer.html");
        registry.addViewController("/task").setViewName("forward:/pages/index/index.html");
        registry.addViewController("/task/").setViewName("forward:/pages/index/index.html");
        registry.addViewController("/").setViewName("forward:/pages/index/home.html");
        registry.addViewController("").setViewName("forward:/pages/index/home.html");
        registry.addViewController("/home").setViewName("forward:/pages/index/home.html");
        registry.addViewController("/home/").setViewName("forward:/pages/index/home.html");
    }
}

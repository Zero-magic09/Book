package com.village.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.path}")
    private String uploadPath;

    // DISABLED: Using UploadController instead for better error handling
    // @Override
    // public void addResourceHandlers(ResourceHandlerRegistry registry) {
    //     String path = uploadPath;
    //     if (path == null || path.isEmpty()) {
    //         path = "D:/upload/village/";
    //     }
    //
    //     // Use "file:///" prefix for external static resources on Windows (proper URI format)
    //     // Explicitly ensuring the path ends with a slash and uses forward slashes
    //     String formattedPath = path.replace("\\", "/");
    //     if (!formattedPath.endsWith("/")) {
    //         formattedPath += "/";
    //     }
    //     String location = "file:///" + formattedPath;
    //
    //     registry.addResourceHandler("/uploads/**")
    //             .addResourceLocations(location)
    //             .setCachePeriod(3600);
    // }
}

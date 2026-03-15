package com.village.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class UploadController {

    @Value("${upload.path:./upload/}")
    private String uploadPath;

    /**
     * 获取实际的上传目录绝对路径
     * 如果配置的是相对路径，则基于项目根目录解析
     */
    private String getResolvedUploadPath() {
        Path path = Paths.get(uploadPath);
        if (path.isAbsolute()) {
            return uploadPath;
        }
        // 相对路径：基于当前工作目录解析
        String basePath = System.getProperty("user.dir");
        Path resolved = Paths.get(basePath, uploadPath).normalize();
        String result = resolved.toString();
        if (!result.endsWith(File.separator)) {
            result += File.separator;
        }
        return result;
    }

    @GetMapping("/uploads/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            String resolvedPath = getResolvedUploadPath();
            String fullPath = resolvedPath + filename;
            System.out.println("[UploadController] Serving file: " + fullPath);
            
            File file = new File(fullPath);
            
            if (!file.exists()) {
                System.out.println("[UploadController] File not found: " + fullPath);
                return ResponseEntity.notFound().build();
            }
            
            if (!file.canRead()) {
                System.out.println("[UploadController] Cannot read file: " + fullPath);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            Resource resource = new FileSystemResource(file);
            
            // Detect content type
            String contentType;
            try {
                contentType = Files.probeContentType(file.toPath());
            } catch (Exception e) {
                contentType = null;
            }
            
            if (contentType == null) {
                // Fallback based on extension
                if (filename.endsWith(".webp")) {
                    contentType = "image/webp";
                } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
                    contentType = "image/jpeg";
                } else if (filename.endsWith(".png")) {
                    contentType = "image/png";
                } else if (filename.endsWith(".gif")) {
                    contentType = "image/gif";
                } else {
                    contentType = "application/octet-stream";
                }
            }
            
            System.out.println("[UploadController] Success: " + fullPath + " (" + contentType + ")");
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);
                    
        } catch (Exception e) {
            System.err.println("[UploadController] Error serving " + filename + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}


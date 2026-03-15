package com.village.controller;

import com.village.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/common")
public class CommonController {

    @Value("${upload.path}")
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
        System.out.println("[CommonController] Resolved upload path: " + resolved.toString());
        return resolved.toString() + File.separator;
    }

    @PostMapping("/upload")
    public ApiResponse<String> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ApiResponse.error(400, "文件不能为空");
        }

        String resolvedPath = getResolvedUploadPath();
        File destDir = new File(resolvedPath);
        if (!destDir.exists()) {
            boolean created = destDir.mkdirs();
            System.out.println("[CommonController] Creating upload directory: " + resolvedPath + " -> " + created);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String fileName = UUID.randomUUID().toString() + extension;
        File destFile = new File(resolvedPath + fileName);

        try {
            file.transferTo(destFile);
            System.out.println("[CommonController] File saved: " + destFile.getAbsolutePath());
            // 返回可访问的 URL 路径
            String url = "/uploads/" + fileName;
            return ApiResponse.success("上传成功", url);
        } catch (IOException e) {
            System.err.println("[CommonController] Upload failed: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(500, "上传失败: " + e.getMessage());
        }
    }
}


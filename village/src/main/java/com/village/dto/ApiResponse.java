package com.village.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    
    public ApiResponse() {}
    
    public ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data);
    }
    
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(200, message, data);
    }
    
    /**
     * 创建错误响应（带类型参数，用于需要类型匹配的场景）
     */
    @SuppressWarnings("unchecked")
    public static <T> ApiResponse<T> error(int code, String message) {
        return (ApiResponse<T>) new ApiResponse<>(code, message, null);
    }
    
    /**
     * 创建错误响应（默认500状态码）
     */
    @SuppressWarnings("unchecked")
    public static <T> ApiResponse<T> error(String message) {
        return (ApiResponse<T>) new ApiResponse<>(500, message, null);
    }
}

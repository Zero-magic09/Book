package com.village.dto;

import lombok.Data;

@Data
public class UserProfileDTO {
    private Long id;
    private String name; // realName
    private String phone;
    private String avatar;
    private String role;
    private String roleTag;
    
    private Integer footprintCount;
    private Integer favoritesCount;
    private Integer points;
    private String idCard; // Add field
}

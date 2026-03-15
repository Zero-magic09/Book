package com.village;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@Slf4j
@SpringBootApplication
public class VillageApplication {

    public static void main(String[] args) {
        // 设置默认时区
        System.setProperty("user.timezone", "Asia/Shanghai");
        SpringApplication.run(VillageApplication.class, args);
    }

    @Bean
    public ApplicationRunner applicationRunner() {
        return args -> {
            log.info("\n" +
                    "╔═══════════════════════════════════════════════════════════╗\n" +
                    "║                                                           ║\n" +
                    "║   🌾 乡村农产品直销平台后端服务启动成功！                        ║\n" +
                    "║                                                           ║\n" +
                    "║   管理后台: http://localhost:5173                           ║\n" +
                    "║   API 文档: http://localhost:8080/swagger-ui/index.html    ║\n" +
                    "║                                                           ║\n" +
                    "╚═══════════════════════════════════════════════════════════╝");
        };
    }
}


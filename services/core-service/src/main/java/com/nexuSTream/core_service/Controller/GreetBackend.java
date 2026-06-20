package com.nexuSTream.core_service.Controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
public class GreetBackend {
    @GetMapping("/health-check")
    public String getMethodName() {
        return new String("hello master supratim");
    }
    
}

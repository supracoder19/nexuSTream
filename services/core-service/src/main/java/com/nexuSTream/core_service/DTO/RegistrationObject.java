package com.nexuSTream.core_service.DTO;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter @NoArgsConstructor @ToString
public class RegistrationObject {
    private String username;
    private String password;
    private String email;
}

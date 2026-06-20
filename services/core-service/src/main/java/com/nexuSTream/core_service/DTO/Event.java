package com.nexuSTream.core_service.DTO;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor  // <-- Crucial for deserialization!
@AllArgsConstructor
public class Event<T> {
    private String key;
    private T value;
}

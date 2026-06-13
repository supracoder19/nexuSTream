package com.nexuSTream.core_service.DTO;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QueueMessage<T> {
    private String topic;
    private Event<T> event; // Your dynamic payload
}

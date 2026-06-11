package com.nexuSTream.core_service.Models;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
// import java.util.Objects;

@Embeddable
@NoArgsConstructor @AllArgsConstructor @Getter @Setter @EqualsAndHashCode
public class CustomUniqueId implements Serializable {
    
    private Long oneId;
    private Long otherId;

    // // Equals and HashCode are REQUIRED for composite keys
    // @Override
    // public boolean equals(Object o) {
    //     if (this == o) return true;
    //     if (o == null || getClass() != o.getClass()) return false;
    //     CustomUniqueId that = (CustomUniqueId) o;
    //     return Objects.equals(userId, that.userId) && Objects.equals(otherId, that.otherId);
    // }

    // @Override
    // public int hashCode() {
    //     return Objects.hash(userId, otherId);
    // }

    // Getters and Setters
}
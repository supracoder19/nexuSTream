package com.nexuSTream.core_service.DTO;

import java.util.List;

import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
@Component
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @ToString
public class ResponseObject<T> {
    private String msg=null;
    private boolean success=true;
    private List<T> data=null;
    public boolean getSuccess()
    {
        return success;
    }
    public void setSuccess(boolean value)
    {
        this.success=value;
    }
}

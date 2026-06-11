package com.nexuSTream.core_service.Controller;

import org.springframework.web.bind.annotation.RestController;

import com.nexuSTream.core_service.Service.NotificationService;

import lombok.AllArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;



@RestController
@RequestMapping("/notifications")
@AllArgsConstructor
public class NotificationController {
    private NotificationService nseve;
    @GetMapping("")
    public String getMethodName() {
        return new String("hello");
    }
    
   @GetMapping("/unread")
   public ResponseEntity<?> fetchUnreadNotifications() {
       return ResponseEntity.ok(nseve.fetchUnreadNotifications());
   }
   @PostMapping("/all")
   public ResponseEntity<?> fetchAllNotifications(@RequestBody Map<String,Integer> req) {
       return ResponseEntity.ok(nseve.fetchAllNotifications(req.get("pageNo"),req.get("pageSize")));
   }
   @PostMapping("/markRead/{notificationId}")
   public ResponseEntity<?> fetchAllNotifications(@PathVariable(name="notificationId") Long id) {
       return ResponseEntity.ok(nseve.markRead(id));
   }
    
}

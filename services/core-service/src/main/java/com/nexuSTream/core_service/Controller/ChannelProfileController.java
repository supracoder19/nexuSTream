package com.nexuSTream.core_service.Controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexuSTream.core_service.DTO.ChannelDetailsReq;
import com.nexuSTream.core_service.Service.ChannelService;

import lombok.AllArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;



@RestController
@RequestMapping("/channel")
@AllArgsConstructor
public class ChannelProfileController {
    private ChannelService cserve;
   @GetMapping("/search")
   public ResponseEntity<?> searchQuery(@RequestParam(name = "query") String query) {
    
       return ResponseEntity.ok(cserve.searchChannels(query));
   }
   @PostMapping("")
   public ResponseEntity<?> channelProfile(@RequestBody ChannelDetailsReq req) {
       return ResponseEntity.ok(cserve.channelDetails(req));
   }
    @GetMapping("/subscribe/{channelId}")
    public ResponseEntity<?> subscribeChannel(@PathVariable(name = "channelId") Long channelId)
    {
        return ResponseEntity.ok(cserve.subscribeChannel(channelId));
    }
    @GetMapping("/unsubscribe/{channelId}")
    public ResponseEntity<?> unsubscribeChannel(@PathVariable(name = "channelId") Long channelId)
    {
        return ResponseEntity.ok(cserve.unsubscribeChannel(channelId));
    }
}

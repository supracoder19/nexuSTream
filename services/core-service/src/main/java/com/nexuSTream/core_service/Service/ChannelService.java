package com.nexuSTream.core_service.Service;


import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import com.nexuSTream.core_service.DTO.ChannelDescriptionResponse;
import com.nexuSTream.core_service.DTO.ChannelDetailsReq;
import com.nexuSTream.core_service.DTO.ChannelProjection;
import com.nexuSTream.core_service.DTO.Event;
import com.nexuSTream.core_service.DTO.ResponseObject;
import com.nexuSTream.core_service.DTO.UnifiedNotificationEvent;
import com.nexuSTream.core_service.DTO.VideoListProjection;
import com.nexuSTream.core_service.Models.Channel;
import com.nexuSTream.core_service.Models.CustomUniqueId;
import com.nexuSTream.core_service.Models.Notification;
import com.nexuSTream.core_service.Models.Subscriber;
import com.nexuSTream.core_service.Models.User;
// import com.nexuSTream.core_service.Models.Channel;
import com.nexuSTream.core_service.Repository.ChannelRepo;
import com.nexuSTream.core_service.Repository.NotificationRepo;
import com.nexuSTream.core_service.Repository.SubRepo;
import com.nexuSTream.core_service.Repository.UserRepo;
import com.nexuSTream.core_service.Repository.VideoRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ChannelService {
    private ChannelRepo cRepo;
    private UserRepo urepo;
    private NotificationRepo nrepo;
    private SubRepo srepo;
    private AuthService aserve;
    private VideoRepo vrepo;
    private KafkaService kaf;
    public ResponseObject<?> searchChannels(String query)
    {
        ResponseObject<ChannelProjection> res=new ResponseObject<>();
        try {
            if(query.isEmpty()||query.trim().isEmpty())
            {
                throw new Exception("No valid Query");
            }
            res.setMsg("Search for "+query+" successfull");
            List<ChannelProjection> results=cRepo.findByChannelNameContaining(query.trim());
            res.setData(results);
        } catch (Exception e) {
            // TODO: handle exception
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }
    public ResponseObject<?> channelDetails(ChannelDetailsReq req)
    {
        ResponseObject<ChannelDescriptionResponse> res=new ResponseObject<>();
        try {
            res.setMsg("successfull");
            User u=urepo.findByUsername(aserve.getUserName()).orElseThrow(()->new Exception("User unauthorized"));
            ChannelProjection result=cRepo.findProjectedById(Long.valueOf(req.getChannelId())).orElseThrow(()->new Exception("Channel Not found"));
            Subscriber s=srepo.findById(new CustomUniqueId(Long.valueOf(req.getChannelId()),u.getId())).orElse(null);
            boolean subscribed=true;
            if (s==null) {
                subscribed=false;
            }
            List<VideoListProjection> l=vrepo.fetchCustomVideoList(result.getId(),false,true);
            ChannelDescriptionResponse res1= new ChannelDescriptionResponse(result.getId(),result.getChannelName(),subscribed,result.getDescription(),result.getSubscriberCount(),l) ;
            res.setData(List.of(res1));
        } catch (Exception e) {
            // TODO: handle exception
            res.setSuccess(false);
            res.setData(null);
            res.setMsg(e.getMessage());
        }
        return res;
    }
    public ResponseObject<?> subscribeChannel(Long channelId){
        ResponseObject<String> res= new ResponseObject<>();
        try {
            Channel ch= cRepo.findById(channelId).orElseThrow(()->new Exception("No channel found"));
            User u= urepo.findByUsername(aserve.getUserName()).orElseThrow(()->new Exception("unauthorized"));
            Subscriber sub= srepo.findById(new CustomUniqueId(ch.getId(),u.getId())).orElse(null);
            if(sub!=null) throw new Exception("already subscribed");
            sub=new Subscriber();
            sub.setChannel(ch);
            sub.setSub(u);
            sub.setId(new CustomUniqueId(ch.getId(),u.getId()));
            srepo.save(sub);
            Notification n=new Notification();
            n.setType("CHANNEL_SUBSCRIBED");
            n.setContent("Your channel was subscribed by "+u.getUsername()+"!");
            n.setRecipient(ch.getOwner());
            nrepo.save(n);
            res.setMsg("Subscribed");
            Map<String,Object> mp = new HashMap<>();
            mp.put("ownerId",sub.getChannel().getOwner().getId());
            UnifiedNotificationEvent notice =  new UnifiedNotificationEvent("channel subscribed",u.getId(),u.getUsername(),null,mp);
            kaf.publish("notification", new Event<>("channel subscribed",notice));
        } catch (Exception e) {
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }
    public ResponseObject<?> unsubscribeChannel(Long channelId){
        ResponseObject<String> res= new ResponseObject<>();
        try {
            Channel ch= cRepo.findById(channelId).orElseThrow(()->new Exception("No channel found"));
            User u= urepo.findByUsername(aserve.getUserName()).orElseThrow(()->new Exception("unauthorized"));
            Subscriber sub= srepo.findById(new CustomUniqueId(ch.getId(),u.getId())).orElseThrow(()->new Exception("Not subscribed"));
            srepo.delete(sub);
            res.setMsg("Unsubscribed");
        } catch (Exception e) {
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }
}

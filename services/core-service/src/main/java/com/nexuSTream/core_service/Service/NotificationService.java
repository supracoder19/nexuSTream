package com.nexuSTream.core_service.Service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.nexuSTream.core_service.DTO.NotificationProjection;
import com.nexuSTream.core_service.DTO.ResponseObject;
import com.nexuSTream.core_service.Models.Notification;
import com.nexuSTream.core_service.Models.User;
import com.nexuSTream.core_service.Repository.NotificationRepo;
import com.nexuSTream.core_service.Repository.UserRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class NotificationService {
    private NotificationRepo nrepo;
    private UserRepo urepo;
    private AuthService aserve;
    public ResponseObject<?> fetchUnreadNotifications()
    {
        ResponseObject<Page<?>> res = new ResponseObject<>();
        try {
            User u= urepo.findByUsername(aserve.getUserName()).orElseThrow(()->new Exception("Unauthorized"));
            Pageable pageable = PageRequest.of(0, 5, Sort.by("createdAt").descending());
            Page<NotificationProjection> nots=nrepo.fetchUnreadNotifications(u.getId(),pageable);
            res.setMsg("Notifications fetched");
            res.setData(List.of(nots));
        } catch (Exception e) {
            res.setMsg("Could not fetch notifications");
            res.setSuccess(false);
        }
        return res;
    }
    public ResponseObject<?> fetchAllNotifications(int pageNo, int pageSize)
    {
        ResponseObject<Page<?>> res = new ResponseObject<>();
        try {
            User u= urepo.findByUsername(aserve.getUserName()).orElseThrow(()->new Exception("Unauthorized"));
            Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by("createdAt").descending());
            Page<NotificationProjection> nots=nrepo.findByRecipientId(u.getId(),pageable);
            res.setMsg("Notifications fetched");
            res.setData(List.of(nots));
        } catch (Exception e) {
            res.setMsg("Could not fetch notifications");
            res.setSuccess(false);
        }
        return res;
    }
     public ResponseObject<?> markRead(Long id)
    {
        ResponseObject<String> res = new ResponseObject<>();
        try {
            Notification n= nrepo.findById(id).orElseThrow(()->new Exception("Notification not found"));
            n.setIsRead(true);
            nrepo.save(n);
            res.setMsg("Notifications marked read");
        } catch (Exception e) {
            res.setMsg(e.getMessage());
            res.setSuccess(false);
        }
        return res;
    }
}

package com.smartchat.autoweb.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class AppErrorController implements ErrorController {

    @RequestMapping("/error")
    public RedirectView handleError(HttpServletRequest request) {
        Object code = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String status = code == null ? "500" : String.valueOf(code);
        return new RedirectView("/home?error=" + status + "&path=" + request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI));
    }
}

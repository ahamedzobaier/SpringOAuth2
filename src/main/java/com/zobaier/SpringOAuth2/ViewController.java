package com.zobaier.SpringOAuth2;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @GetMapping({"/home", "/login", "/signup", "/profile"})
    public String forward() {
        return "forward:/index.html";
    }
}

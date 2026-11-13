package com.kalasathi.controller;

import com.kalasathi.dto.DemoDtos.ArtisanProfit;
import com.kalasathi.dto.DemoDtos.LowStockProduct;
import com.kalasathi.service.DemoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/demo-api")
public class DemoController {
    private final DemoService demoService;

    public DemoController(DemoService demoService) {
        this.demoService = demoService;
    }

    @GetMapping("/artisans/profit")
    public List<ArtisanProfit> artisanProfit() {
        return demoService.artisanProfit();
    }

    @GetMapping("/products/low-stock")
    public List<LowStockProduct> lowStock() {
        return demoService.lowStockProducts();
    }
}

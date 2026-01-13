package com.ai.inventoryapplication.Service;

import com.ai.inventoryapplication.DTO.TransactionCodeGenerator;
import com.ai.inventoryapplication.Entity.*;
import com.ai.inventoryapplication.Repository.ProductRepository;
import com.ai.inventoryapplication.Repository.PurchaseOrderRepository;
import com.ai.inventoryapplication.Repository.StockTransactionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StockTransactionService {

    private final StockTransactionRepository transactionRepo;
    private final ProductRepository productRepo;
    private final PurchaseOrderRepository poRepo;

    public StockTransactionService(
            StockTransactionRepository transactionRepo,
            ProductRepository productRepo,
            PurchaseOrderRepository poRepo) {

        this.transactionRepo = transactionRepo;
        this.productRepo = productRepo;
        this.poRepo = poRepo;
    }

    // =====================================================
    // STOCK OUT (SALE)
    // =====================================================
    public StockTransaction stockOut(String productId, int qty, Long userId) {

        if (userId == null) {
            throw new RuntimeException("User not logged in");
        }

        if (qty <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getCurrentStock() < qty) {
            throw new RuntimeException("Insufficient stock");
        }

        // 🔥 Latest completed PO
        PurchaseOrder po = poRepo
                .findTopByProductIdAndStatusOrderByUpdatedAtDesc(
                        productId, PurchaseOrderStatus.COMPLETED)
                .orElseThrow(() -> new RuntimeException("No completed Purchase Order found"));

        // Update stock
        product.setCurrentStock(product.getCurrentStock() - qty);
        productRepo.save(product);

        // Create Stock OUT (IO)
        StockTransaction tx = new StockTransaction();
        tx.setTransactionRef(po.getPoNumber());                    // PO-XXXX
        tx.setTransactionCode(TransactionCodeGenerator.generateIO()); // IO-XXXX
        tx.setProductId(productId);
        tx.setQuantity(qty);
        tx.setType(TransactionType.OUT);
        tx.setRate(product.getSalePrice());
        tx.setTransactionValue(product.getSalePrice() * qty);
        tx.setHandledBy(userId);

        return transactionRepo.save(tx);
    }

    // =====================================================
    // TRANSACTION HISTORY
    // =====================================================
    public List<StockTransaction> getAllTransactions() {
        return transactionRepo.findAll();
    }
}

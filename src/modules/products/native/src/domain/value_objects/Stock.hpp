#pragma once
#include <stdexcept>

namespace MoneyMaker::Products::Domain {

/**
 * Value Object: Stock
 * Encapsula a lógica de negócio relacionada ao estoque
 */
class Stock {
private:
    int quantity;
    int lowStockThreshold;
    
    Stock(int q, int threshold) 
        : quantity(q), lowStockThreshold(threshold) {}
    
public:
    /**
     * Factory Method para criar um Stock válido
     */
    static Stock create(int quantity, int lowStockThreshold = 10) {
        if (quantity < 0) {
            throw std::invalid_argument("Estoque não pode ser negativo");
        }
        if (lowStockThreshold < 0) {
            throw std::invalid_argument("Limite de estoque baixo não pode ser negativo");
        }
        return Stock(quantity, lowStockThreshold);
    }
    
    int getValue() const {
        return quantity;
    }
    
    int getThreshold() const {
        return lowStockThreshold;
    }
    
    bool isZero() const {
        return quantity == 0;
    }
    
    bool isLow() const {
        return quantity > 0 && quantity <= lowStockThreshold;
    }
    
    bool hasSufficient(int required) const {
        return quantity >= required;
    }
    
    /**
     * Adicionar quantidade ao estoque
     */
    Stock add(int amount) const {
        if (amount < 0) {
            throw std::invalid_argument("Quantidade a adicionar não pode ser negativa");
        }
        return Stock(quantity + amount, lowStockThreshold);
    }
    
    /**
     * Subtrair quantidade do estoque
     */
    Stock subtract(int amount) const {
        if (amount < 0) {
            throw std::invalid_argument("Quantidade a subtrair não pode ser negativa");
        }
        
        int newQuantity = quantity - amount;
        if (newQuantity < 0) {
            throw std::invalid_argument("Operação resultaria em estoque negativo");
        }
        return Stock(newQuantity, lowStockThreshold);
    }
    
    /**
     * Definir novo valor de estoque
     */
    Stock set(int quantity) const {
        return Stock::create(quantity, lowStockThreshold);
    }
    
    bool equals(const Stock& other) const {
        return quantity == other.quantity;
    }
};

} // namespace MoneyMaker::Products::Domain



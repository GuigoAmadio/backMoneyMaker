#pragma once
#include <string>
#include <vector>
#include <memory>
#include <stdexcept>
#include "../value_objects/Price.hpp"
#include "../value_objects/Stock.hpp"
#include "../value_objects/ProductStatus.hpp"

namespace MoneyMaker::Products::Domain {

/**
 * Product Props Structure
 */
struct ProductProps {
    std::string id;
    std::string clientId;
    std::string name;
    std::string description;
    std::string sku;
    Price price;
    Stock stock;
    ProductStatus status;
    std::string categoryId;
    std::string image;
    
    ProductProps(
        const std::string& id,
        const std::string& clientId,
        const std::string& name,
        const std::string& description,
        const std::string& sku,
        Price price,
        Stock stock,
        ProductStatus status,
        const std::string& categoryId,
        const std::string& image
    ) : id(id), clientId(clientId), name(name), description(description),
        sku(sku), price(price), stock(stock), status(status),
        categoryId(categoryId), image(image) {}
};

/**
 * Product Entity (Aggregate Root)
 * Entidade rica com comportamento e regras de negócio encapsuladas
 */
class Product {
private:
    ProductProps props;
    std::vector<std::string> domainEvents;
    
    Product(const ProductProps& p) : props(p) {}
    
public:
    /**
     * Factory Method para criar um novo produto
     */
    static Product create(
        const std::string& clientId,
        const std::string& name,
        const std::string& description,
        const std::string& sku,
        Price price,
        Stock stock,
        ProductStatus status,
        const std::string& categoryId = "",
        const std::string& image = ""
    ) {
        // Validações de criação
        if (name.empty()) {
            throw std::invalid_argument("Nome do produto é obrigatório");
        }
        
        if (name.length() > 200) {
            throw std::invalid_argument("Nome do produto não pode exceder 200 caracteres");
        }
        
        ProductProps props(
            "", // ID será gerado pelo banco
            clientId,
            name,
            description,
            sku,
            price,
            stock,
            status,
            categoryId,
            image
        );
        
        Product product(props);
        product.addDomainEvent("ProductCreatedEvent");
        
        return product;
    }
    
    /**
     * Factory Method para reconstruir um produto do banco de dados
     */
    static Product reconstitute(const ProductProps& props) {
        return Product(props);
    }
    
    // ==================== Getters ====================
    
    const std::string& getId() const { return props.id; }
    const std::string& getClientId() const { return props.clientId; }
    const std::string& getName() const { return props.name; }
    const std::string& getDescription() const { return props.description; }
    const std::string& getSku() const { return props.sku; }
    Price getPrice() const { return props.price; }
    Stock getStock() const { return props.stock; }
    ProductStatus getStatus() const { return props.status; }
    const std::string& getCategoryId() const { return props.categoryId; }
    const std::string& getImage() const { return props.image; }
    
    bool isOutOfStock() const {
        return props.stock.isZero();
    }
    
    bool isLowStock() const {
        return props.stock.isLow();
    }
    
    // ==================== Métodos de Negócio ====================
    
    /**
     * Atualizar informações básicas do produto
     */
    void update(
        const std::string* name,
        const std::string* description,
        const std::string* sku,
        const std::string* categoryId,
        const std::string* image
    ) {
        if (name && !name->empty()) {
            if (name->length() > 200) {
                throw std::invalid_argument("Nome do produto não pode exceder 200 caracteres");
            }
            const_cast<std::string&>(props.name) = *name;
        }
        
        if (description) {
            const_cast<std::string&>(props.description) = *description;
        }
        
        if (sku) {
            const_cast<std::string&>(props.sku) = *sku;
        }
        
        if (categoryId) {
            const_cast<std::string&>(props.categoryId) = *categoryId;
        }
        
        if (image) {
            const_cast<std::string&>(props.image) = *image;
        }
    }
    
    /**
     * Atualizar estoque
     */
    void updateStock(int quantity) {
        int previousStock = props.stock.getValue();
        const_cast<Stock&>(props.stock) = Stock::create(quantity, props.stock.getThreshold());
        
        addDomainEvent("StockUpdatedEvent");
        
        if (props.stock.isLow()) {
            addDomainEvent("LowStockEvent");
        }
    }
    
    /**
     * Adicionar quantidade ao estoque
     */
    void addStock(int quantity) {
        int previousStock = props.stock.getValue();
        const_cast<Stock&>(props.stock) = props.stock.add(quantity);
        
        addDomainEvent("StockUpdatedEvent");
    }
    
    /**
     * Diminuir estoque (usado em vendas)
     */
    void decreaseStock(int quantity) {
        if (!props.stock.hasSufficient(quantity)) {
            throw std::runtime_error("Estoque insuficiente");
        }
        
        int previousStock = props.stock.getValue();
        const_cast<Stock&>(props.stock) = props.stock.subtract(quantity);
        
        addDomainEvent("StockUpdatedEvent");
        
        if (props.stock.isLow()) {
            addDomainEvent("LowStockEvent");
        }
    }
    
    /**
     * Atualizar preço do produto
     */
    void updatePrice(Price newPrice) {
        double currentValue = props.price.getValue();
        double newValue = newPrice.getValue();
        
        // Regra de negócio: não permitir redução maior que 50% de uma vez
        if (newValue < currentValue * 0.5) {
            throw std::runtime_error("Redução de preço muito abrupta. Máximo 50% por vez.");
        }
        
        const_cast<Price&>(props.price) = newPrice;
    }
    
    /**
     * Desativar produto
     */
    void deactivate() {
        if (!props.status.isActive()) {
            throw std::runtime_error("Produto já está inativo");
        }
        
        const_cast<ProductStatus&>(props.status) = ProductStatus::inactive();
        addDomainEvent("ProductDeactivatedEvent");
    }
    
    /**
     * Ativar produto
     */
    void activate() {
        if (props.status.isActive()) {
            throw std::runtime_error("Produto já está ativo");
        }
        
        const_cast<ProductStatus&>(props.status) = ProductStatus::active();
    }
    
    /**
     * Verificar se o produto pode ser deletado
     */
    bool canBeDeleted() const {
        return !props.status.isActive();
    }
    
    /**
     * Verificar se o produto pode ser vendido
     */
    bool canBeSold() const {
        return props.status.isActive() && !isOutOfStock();
    }
    
    // ==================== Domain Events ====================
    
    const std::vector<std::string>& getDomainEvents() const {
        return domainEvents;
    }
    
    void clearDomainEvents() {
        domainEvents.clear();
    }
    
private:
    void addDomainEvent(const std::string& event) {
        domainEvents.push_back(event);
    }
};

} // namespace MoneyMaker::Products::Domain



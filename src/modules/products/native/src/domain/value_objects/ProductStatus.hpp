#pragma once
#include <string>

namespace MoneyMaker::Products::Domain {

/**
 * Value Object: ProductStatus
 * Encapsula o status do produto (ativo/inativo)
 */
class ProductStatus {
private:
    bool value;
    
    ProductStatus(bool v) : value(v) {}
    
public:
    static ProductStatus active() {
        return ProductStatus(true);
    }
    
    static ProductStatus inactive() {
        return ProductStatus(false);
    }
    
    static ProductStatus fromBoolean(bool value) {
        return ProductStatus(value);
    }
    
    bool isActive() const {
        return value;
    }
    
    bool getValue() const {
        return value;
    }
    
    bool equals(const ProductStatus& other) const {
        return value == other.value;
    }
    
    std::string toString() const {
        return value ? "Ativo" : "Inativo";
    }
};

} // namespace MoneyMaker::Products::Domain



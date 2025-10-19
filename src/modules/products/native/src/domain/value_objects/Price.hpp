#pragma once
#include <stdexcept>
#include <string>
#include <sstream>
#include <iomanip>

namespace MoneyMaker::Products::Domain {

/**
 * Value Object: Price
 * Encapsula a lógica de negócio relacionada a preços
 */
class Price {
private:
    double value;
    
    Price(double v) : value(v) {}
    
public:
    /**
     * Factory Method para criar um Price válido
     */
    static Price create(double value) {
        if (value < 0) {
            throw std::invalid_argument("Preço não pode ser negativo");
        }
        if (value > 1000000) {
            throw std::invalid_argument("Preço excede o limite máximo de R$ 1.000.000");
        }
        return Price(value);
    }
    
    double getValue() const {
        return value;
    }
    
    bool isLessThan(const Price& other) const {
        return value < other.value;
    }
    
    bool isGreaterThan(const Price& other) const {
        return value > other.value;
    }
    
    /**
     * Calcular desconto
     */
    Price calculateDiscount(double percentage) const {
        if (percentage < 0 || percentage > 100) {
            throw std::invalid_argument("Percentual de desconto deve estar entre 0 e 100");
        }
        double discountAmount = value * (percentage / 100.0);
        return Price(value - discountAmount);
    }
    
    bool equals(const Price& other) const {
        return value == other.value;
    }
    
    std::string toString() const {
        std::ostringstream oss;
        oss << "R$ " << std::fixed << std::setprecision(2) << value;
        return oss.str();
    }
};

} // namespace MoneyMaker::Products::Domain


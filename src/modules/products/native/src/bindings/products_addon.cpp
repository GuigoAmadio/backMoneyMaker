#include <napi.h>
#include "../domain/entities/Product.hpp"
#include "../domain/value_objects/Price.hpp"
#include "../domain/value_objects/Stock.hpp"
#include "../domain/value_objects/ProductStatus.hpp"

using namespace MoneyMaker::Products::Domain;
using namespace Napi;

/**
 * Wrapper: Criar Produto
 * TypeScript → C++
 */
Value CreateProduct(const CallbackInfo& info) {
    Env env = info.Env();
    
    // Validar argumentos
    if (info.Length() < 1 || !info[0].IsObject()) {
        TypeError::New(env, "Expected an object as first argument")
            .ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Object dto = info[0].As<Object>();
    
    try {
        // Extrair dados do JavaScript
        std::string clientId = dto.Get("clientId").As<String>().Utf8Value();
        std::string name = dto.Get("name").As<String>().Utf8Value();
        
        std::string description = "";
        if (dto.Has("description") && !dto.Get("description").IsNull()) {
            description = dto.Get("description").As<String>().Utf8Value();
        }
        
        std::string sku = "";
        if (dto.Has("sku") && !dto.Get("sku").IsNull()) {
            sku = dto.Get("sku").As<String>().Utf8Value();
        }
        
        double priceValue = dto.Get("price").As<Number>().DoubleValue();
        int stockValue = 0;
        if (dto.Has("stock") && !dto.Get("stock").IsNull()) {
            stockValue = dto.Get("stock").As<Number>().Int32Value();
        }
        
        std::string categoryId = "";
        if (dto.Has("categoryId") && !dto.Get("categoryId").IsNull()) {
            categoryId = dto.Get("categoryId").As<String>().Utf8Value();
        }
        
        std::string image = "";
        if (dto.Has("image") && !dto.Get("image").IsNull()) {
            image = dto.Get("image").As<String>().Utf8Value();
        }
        
        // Criar Value Objects
        Price price = Price::create(priceValue);
        Stock stock = Stock::create(stockValue);
        ProductStatus status = ProductStatus::active();
        
        // Criar Entidade de Domínio
        Product product = Product::create(
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
        
        // Converter para JavaScript Object
        Object result = Object::New(env);
        result.Set("name", String::New(env, product.getName()));
        result.Set("description", String::New(env, product.getDescription()));
        result.Set("sku", String::New(env, product.getSku()));
        result.Set("price", Number::New(env, product.getPrice().getValue()));
        result.Set("stock", Number::New(env, product.getStock().getValue()));
        result.Set("isActive", Boolean::New(env, product.getStatus().isActive()));
        result.Set("canBeSold", Boolean::New(env, product.canBeSold()));
        result.Set("isOutOfStock", Boolean::New(env, product.isOutOfStock()));
        result.Set("isLowStock", Boolean::New(env, product.isLowStock()));
        result.Set("categoryId", String::New(env, product.getCategoryId()));
        result.Set("image", String::New(env, product.getImage()));
        
        // Domain Events
        Array events = Array::New(env);
        auto domainEvents = product.getDomainEvents();
        for (size_t i = 0; i < domainEvents.size(); i++) {
            events[i] = String::New(env, domainEvents[i]);
        }
        result.Set("domainEvents", events);
        
        return result;
        
    } catch (const std::exception& e) {
        Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

/**
 * Wrapper: Validar Preço
 */
Value ValidatePrice(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        TypeError::New(env, "Expected a number as first argument")
            .ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double value = info[0].As<Number>().DoubleValue();
    
    try {
        Price price = Price::create(value);
        Object result = Object::New(env);
        result.Set("valid", Boolean::New(env, true));
        result.Set("value", Number::New(env, price.getValue()));
        result.Set("formatted", String::New(env, price.toString()));
        return result;
    } catch (const std::exception& e) {
        Object result = Object::New(env);
        result.Set("valid", Boolean::New(env, false));
        result.Set("error", String::New(env, e.what()));
        return result;
    }
}

/**
 * Wrapper: Validar Estoque
 */
Value ValidateStock(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        TypeError::New(env, "Expected a number as first argument")
            .ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int value = info[0].As<Number>().Int32Value();
    
    try {
        Stock stock = Stock::create(value);
        Object result = Object::New(env);
        result.Set("valid", Boolean::New(env, true));
        result.Set("value", Number::New(env, stock.getValue()));
        result.Set("isZero", Boolean::New(env, stock.isZero()));
        result.Set("isLow", Boolean::New(env, stock.isLow()));
        return result;
    } catch (const std::exception& e) {
        Object result = Object::New(env);
        result.Set("valid", Boolean::New(env, false));
        result.Set("error", String::New(env, e.what()));
        return result;
    }
}

/**
 * Wrapper: Calcular Desconto
 */
Value CalculateDiscount(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        TypeError::New(env, "Expected two numbers as arguments (price, percentage)")
            .ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double priceValue = info[0].As<Number>().DoubleValue();
    double percentage = info[1].As<Number>().DoubleValue();
    
    try {
        Price price = Price::create(priceValue);
        Price discountedPrice = price.calculateDiscount(percentage);
        
        Object result = Object::New(env);
        result.Set("originalPrice", Number::New(env, price.getValue()));
        result.Set("discountedPrice", Number::New(env, discountedPrice.getValue()));
        result.Set("discount", Number::New(env, price.getValue() - discountedPrice.getValue()));
        result.Set("percentage", Number::New(env, percentage));
        
        return result;
    } catch (const std::exception& e) {
        Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

/**
 * Inicialização do Native Addon
 */
Object Init(Env env, Object exports) {
    // Exportar funções para JavaScript
    exports.Set("createProduct", Function::New(env, CreateProduct));
    exports.Set("validatePrice", Function::New(env, ValidatePrice));
    exports.Set("validateStock", Function::New(env, ValidateStock));
    exports.Set("calculateDiscount", Function::New(env, CalculateDiscount));
    
    return exports;
}

// Registrar módulo
NODE_API_MODULE(products, Init)



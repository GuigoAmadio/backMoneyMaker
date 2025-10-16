#!/bin/bash

# Configurações
DB_HOST="${DATABASE_HOST:-backend-postgres-1}"
DB_USER="${DATABASE_USER:-postgres}"
DB_NAME="${DATABASE_NAME:-moneymaker}"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"
LOG_FILE="/backups/backup.log"

# Função para log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

log "🚀 Iniciando backup do banco de dados..."

# Verificar se o PostgreSQL está rodando
if ! pg_isready -h $DB_HOST -p 5432 -U $DB_USER; then
    log "❌ PostgreSQL não está rodando ou não está acessível"
    exit 1
fi

# Executar backup
log "📦 Criando backup: $BACKUP_FILE"
if pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/$BACKUP_FILE"; then
    log "✅ Backup criado com sucesso: $BACKUP_FILE"
    
    # Comprimir backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    log "🗜️ Backup comprimido: ${BACKUP_FILE}.gz"
    
    # Manter apenas os últimos 7 backups
    cd $BACKUP_DIR
    BACKUP_COUNT=$(ls -1 backup_*.sql.gz 2>/dev/null | wc -l)
    if [ $BACKUP_COUNT -gt 7 ]; then
        BACKUPS_TO_DELETE=$((BACKUP_COUNT - 7))
        ls -t backup_*.sql.gz | tail -n $BACKUPS_TO_DELETE | xargs -r rm
        log "🧹 Removidos $BACKUPS_TO_DELETE backups antigos (mantidos últimos 7)"
    fi
    
    # Mostrar tamanho do backup
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    log "📊 Tamanho do backup: $BACKUP_SIZE"
    
else
    log "❌ Erro ao criar backup"
    exit 1
fi

log "🎉 Processo de backup finalizado com sucesso!"

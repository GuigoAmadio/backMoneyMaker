#!/bin/bash

# Script para restaurar backup
# Uso: ./restore.sh backup_20241006_140000.sql.gz

if [ -z "$1" ]; then
    echo "❌ Erro: Especifique o arquivo de backup"
    echo "Uso: $0 <arquivo_backup>"
    echo "Exemplo: $0 backup_20241006_140000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_USER="${POSTGRES_USER:-moneymaker_user}"
DB_NAME="${POSTGRES_DB:-moneymaker_prod}"
BACKUP_DIR="/backups"
LOG_FILE="/backups/restore.log"

# Função para log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Verificar se o arquivo de backup existe
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    log "❌ Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

log "🔄 Iniciando restauração do backup: $BACKUP_FILE"

# Verificar se o PostgreSQL está rodando
if ! pg_isready -h $DB_HOST -p 5432 -U $DB_USER; then
    log "❌ PostgreSQL não está rodando ou não está acessível"
    exit 1
fi

# Confirmar ação
echo "⚠️  ATENÇÃO: Esta operação irá SUBSTITUIR todos os dados do banco!"
echo "Banco: $DB_NAME"
echo "Backup: $BACKUP_FILE"
read -p "Tem certeza que deseja continuar? (digite 'SIM' para confirmar): " confirmation

if [ "$confirmation" != "SIM" ]; then
    log "❌ Restauração cancelada pelo usuário"
    exit 1
fi

log "🗑️ Limpando banco de dados atual..."

# Limpar banco atual
if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"; then
    log "✅ Banco limpo com sucesso"
else
    log "❌ Erro ao limpar banco"
    exit 1
fi

log "📥 Restaurando backup..."

# Restaurar backup
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Backup comprimido
    if gunzip -c "$BACKUP_DIR/$BACKUP_FILE" | psql -h $DB_HOST -U $DB_USER -d $DB_NAME; then
        log "✅ Backup restaurado com sucesso!"
    else
        log "❌ Erro ao restaurar backup"
        exit 1
    fi
else
    # Backup não comprimido
    if psql -h $DB_HOST -U $DB_USER -d $DB_NAME < "$BACKUP_DIR/$BACKUP_FILE"; then
        log "✅ Backup restaurado com sucesso!"
    else
        log "❌ Erro ao restaurar backup"
        exit 1
    fi
fi

log "🎉 Restauração finalizada com sucesso!"

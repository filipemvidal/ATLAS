import os

class Config:
    """Configurações base da aplicação"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = False
    TESTING = False

class DevelopmentConfig(Config):
    """Configurações de desenvolvimento"""
    DEBUG = True

class ProductionConfig(Config):
    """Configurações de produção"""
    DEBUG = False

class TestingConfig(Config):
    """Configurações de teste"""
    TESTING = True

# Dicionário de configurações
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

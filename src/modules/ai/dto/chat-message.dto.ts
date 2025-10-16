import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsObject()
  @IsOptional()
  context?: {
    currentRoute?: string;
    currentPage?: string;
    selectedItems?: any[];
    filters?: any;
  };
}

export class AIActionDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsObject()
  @IsOptional()
  payload?: any;
}

export class AIResponseDto {
  message: string;
  action?: {
    type: 'navigate' | 'open-modal' | 'execute-action' | 'show-data';
    payload: any;
  };
  conversationId: string;
  timestamp: Date;
}

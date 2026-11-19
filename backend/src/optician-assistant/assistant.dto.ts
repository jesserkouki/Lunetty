import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class OpticianAssistantMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  content!: string;
}

export class OpticianAssistantChatDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => OpticianAssistantMessageDto)
  messages!: OpticianAssistantMessageDto[];
}

export class ConfirmOpticianAssistantProposalDto {
  @IsString()
  @MaxLength(4096)
  token!: string;
}
